import { Controller } from "@hotwired/stimulus"
import EncryptionHelper from "libs/encryption_helper"

export default class extends Controller {
  static targets = ["content", "password2", "form", "encryptedContent", "password1", "password1Input", "password1InputContainer", "password2Input", "password2InputContainer", "decryptButton", "decryptedContent", "password2Present", "decryptForm", "statusMessage", "viewsCount", "initialViews", "expirationTime"]

  connect() {
    this.debug("Message controller connected")
    
    // If on decrypt page, check if password1 is in URL hash
    if (this.hasPassword1Target) {
      const password1FromHash = window.location.hash ? window.location.hash.substring(1) : null
      
      if (password1FromHash && password1FromHash.length === 16) {
        // Password1 is in URL hash - store it and hide the input field
        this.password1Target.value = password1FromHash
        this.debug("Password1 loaded from URL hash")
        
        // Hide password1 input container if it exists
        if (this.hasPassword1InputContainerTarget) {
          this.password1InputContainerTarget.style.display = 'none'
        }
      } else {
        // No password1 in URL - show the input field so user can enter it
        this.debug("No password1 in URL hash - user must provide it")
        
        if (this.hasPassword1InputContainerTarget) {
          this.password1InputContainerTarget.style.display = 'block'
        }
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
    
    // Get password1 from either: 
    // 1. Hidden field (if it was in URL hash)
    // 2. User input field (if user had to enter it manually)
    let password1 = this.password1Target.value
    
    if (!password1 && this.hasPassword1InputTarget) {
      password1 = this.password1InputTarget.value
      // Store it in the hidden field for consistency
      this.password1Target.value = password1
    }
    
    // Use hasPassword2InputTarget to check if the target exists before accessing it
    const password2 = this.hasPassword2InputTarget ? this.password2InputTarget.value : null

    if (!encryptedContent) {
      alert("Missing encrypted content")
      return
    }
    
    if (!password1) {
      alert("Please enter the encryption key (password1)")
      return
    }
    
    if (password1.length !== 16) {
      alert("Encryption key (password1) must be exactly 16 characters")
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

      // Update status message after decryption
      this.updateStatusMessage()

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

  // Update the status message after decryption
  updateStatusMessage() {
    if (!this.hasStatusMessageTarget || !this.hasInitialViewsTarget) {
      return
    }

    const initialViews = parseInt(this.initialViewsTarget.textContent)
    const remainingViews = initialViews - 1
    const expirationTime = this.hasExpirationTimeTarget ? this.expirationTimeTarget.textContent : ''

    if (remainingViews <= 0) {
      // Message was destroyed
      this.statusMessageTarget.innerHTML = '<strong class="message-destroyed">The message has been destroyed</strong>. The link won\'t work anymore. Copy any important content and keep it in a secure location.'
    } else {
      // Message still has views remaining
      const viewsText = remainingViews === 1 ? '1 more time' : `${remainingViews} more times`
      this.statusMessageTarget.innerHTML = `This message can be viewed <strong class="highlight"><span>${viewsText}</span></strong> or until <strong class="highlight">${expirationTime}</strong>, whichever comes first.`
    }
  }
}