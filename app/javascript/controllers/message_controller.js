import { Controller } from "@hotwired/stimulus"
import EncryptionHelper from "libs/encryption_helper"

export default class extends Controller {
  static targets = ["content", "password2", "form", "encryptedContent", "password1", "password2Input", "decryptButton", "decryptedContent", "password2Present", "decryptForm"]

  connect() {
    this.debug("Message controller connected")
    
    // If on decrypt page, read password1 from URL hash and store it
    if (this.hasPassword1Target && window.location.hash) {
      // Remove the # from the hash
      const password1FromHash = window.location.hash.substring(1)
      if (password1FromHash) {
        this.password1Target.value = password1FromHash
        this.debug("Password1 loaded from URL hash")
      }
    }
  }

  // Helper method to log only in development
  debug(...args) {
    const isDevelopment = document.querySelector('meta[name="env"]')?.content === 'development'
    if (isDevelopment) {
      console.log(...args)
    }
  }

  // Handle form submission for creating a message
  async create(event) {
    event.preventDefault()

    const submitButton = this.formTarget.querySelector('input[type="submit"]')
    submitButton.disabled = true
    submitButton.value = "Encrypting..."

    const content = this.contentTarget.value
    const password2 = this.password2Target.value || null
    
    this.debug("Content length:", content.length)
    this.debug("Password2 raw value:", this.password2Target.value)
    this.debug("Password2 after null check:", password2)

    if (!content.trim()) {
      alert("Please enter a message")
      submitButton.disabled = false
      submitButton.value = "Create Secure Link"
      return
    }

    // Validate password2 if provided
    if (password2 && (password2.length < 10 || password2.length > 64)) {
      alert("Password2 must be between 10 and 64 characters long")
      submitButton.disabled = false
      submitButton.value = "Create Secure Link"
      return
    }

    try {
      // Generate password1 on client side (keep it only in memory, never send to server)
      const password1 = EncryptionHelper.generateRandomString(16)
      this.debug("Generated password1:", password1)

      // Encrypt the message
      const encryptedContent = await EncryptionHelper.encryptor(content, password1, password2)
      this.debug("Encrypted content length:", encryptedContent.length)

      // Set the encrypted content in a hidden field
      this.encryptedContentTarget.value = encryptedContent
      this.debug("Set encrypted content in form, value:", this.encryptedContentTarget.value.substring(0, 50) + "...")
      this.debug("Encrypted content target name:", this.encryptedContentTarget.name)

      // Clear the original content to ensure server never sees plain text
      this.contentTarget.value = ""

      // Set the hidden boolean flag to indicate password2 was provided (so server records requirement)
      this.debug("password2 value:", password2 ? `(${password2.length} chars)` : "null")
      if (password2) {
        this.password2PresentTarget.value = "true"
        this.debug("Set password2_present flag to true")
      } else {
        this.password2PresentTarget.value = "false"
        this.debug("No password2 provided, flag set to false")
      }

      // Submit the form via fetch to get JSON response
      this.debug("About to submit form")
      const formData = new FormData(this.formTarget)
      
      // Remove password1 from form data - server should never receive it
      formData.delete('password1')
      
      this.debug("Form data before submit:")
      for (let [key, value] of formData.entries()) {
        if (key.includes('encrypted')) {
          this.debug(`  ${key}: ${value.substring(0, 50)}...`)
        } else {
          this.debug(`  ${key}: ${value}`)
        }
      }

      const response = await fetch(this.formTarget.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Store password1 and message ID in sessionStorage (never send to server)
        sessionStorage.setItem('created_password1', password1)
        sessionStorage.setItem('created_message_id', data.id)
        sessionStorage.setItem('created_base_url', data.base_url)
        // Redirect to created page without password1
        window.location.href = `/messages/created?id=${data.id}`
      } else {
        const errorData = await response.json()
        alert(`Failed to create message: ${errorData.errors?.join(', ') || 'Unknown error'}`)
        submitButton.disabled = false
        submitButton.value = "Create Secure Link"
      }
    } catch (error) {
      console.error("Encryption failed:", error)
      alert("Failed to encrypt message. Please try again.")
      submitButton.disabled = false
      submitButton.value = "Create Secure Link"
    }
  }

  // Handle decryption
  async decrypt(event) {
    event.preventDefault()

    const encryptedContent = this.encryptedContentTarget.value
    const password1 = this.password1Target.value
    // Use hasPassword2InputTarget to check if the target exists before accessing it
    const password2 = this.hasPassword2InputTarget ? this.password2InputTarget.value : null

    if (!encryptedContent || !password1) {
      alert("Missing encrypted content or password1")
      return
    }

    try {
      const decryptedContent = await EncryptionHelper.decryptor(encryptedContent, password1, password2)

      // Display the decrypted content
      this.decryptedContentTarget.innerHTML = decryptedContent
      this.decryptedContentTarget.style.display = "block"

      // Hide the entire decrypt form (button and password input if present)
      if (this.hasDecryptFormTarget) {
        this.decryptFormTarget.style.display = "none"
      }

      // Notify server that the client successfully decrypted the message so it can decrement view count.
      try {
        const messageId = document.getElementById('message-id')?.value
        if (messageId) {
          await fetch(`/` + encodeURIComponent(messageId) + `/mark_viewed`, {
            method: 'POST',
            headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content }
          })
        }
      } catch (err) {
        console.warn('Failed to notify server of view:', err)
      }

    } catch (error) {
      console.error("Decryption failed:", error)
      alert("Failed to decrypt message. Please check your passwords.")
    }
  }
}