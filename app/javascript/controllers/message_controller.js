import { Controller } from "@hotwired/stimulus"
import EncryptionHelper from "libs/encryption_helper"

export default class extends Controller {
  static targets = ["content", "password2", "form", "encryptedContent", "password1", "password2Input", "decryptButton", "decryptedContent", "password2Present", "decryptForm"]

  connect() {
    console.log("Message controller connected")
  }

  // Handle form submission for creating a message
  async create(event) {
    event.preventDefault()

    const submitButton = this.formTarget.querySelector('input[type="submit"]')
    submitButton.disabled = true
    submitButton.value = "Encrypting..."

    const content = this.contentTarget.value
    const password2 = this.password2Target.value || null
    
    console.log("Content length:", content.length)
    console.log("Password2 raw value:", this.password2Target.value)
    console.log("Password2 after null check:", password2)

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
      // Generate password1 on client side
      const password1 = EncryptionHelper.generateRandomString(16)
      console.log("Generated password1:", password1)

      // Encrypt the message
      const encryptedContent = await EncryptionHelper.encryptor(content, password1, password2)
      console.log("Encrypted content length:", encryptedContent.length)

      // Set the encrypted content in a hidden field
      this.encryptedContentTarget.value = encryptedContent
      console.log("Set encrypted content in form, value:", this.encryptedContentTarget.value.substring(0, 50) + "...")
      console.log("Encrypted content target name:", this.encryptedContentTarget.name)

      // Clear the original content to ensure server never sees plain text
      this.contentTarget.value = ""

      // Set password1 in a hidden field so server can use it for URL generation
      this.password1Target.value = password1
      console.log("Set password1 in form:", password1)
      console.log("Password1 target name:", this.password1Target.name)

      // Set the hidden boolean flag to indicate password2 was provided (so server records requirement)
      console.log("password2 value:", password2 ? `(${password2.length} chars)` : "null")
      if (password2) {
        this.password2PresentTarget.value = "true"
        console.log("Set password2_present flag to true")
      } else {
        this.password2PresentTarget.value = "false"
        console.log("No password2 provided, flag set to false")
      }

      // Submit the form
      console.log("About to submit form")
      console.log("Form data before submit:")
      const formData = new FormData(this.formTarget)
      for (let [key, value] of formData.entries()) {
        if (key.includes('encrypted') || key.includes('password1')) {
          console.log(`  ${key}: ${value.substring(0, 50)}...`)
        } else {
          console.log(`  ${key}: ${value}`)
        }
      }
      this.formTarget.submit()
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