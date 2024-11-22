module EncryptionHelper
    require "openssl"
    require "base64"
    require "securerandom"

    def generate_random_string(length = 16)
      chars = ("a".."z").to_a + ("A".."Z").to_a + ("0".."9").to_a + [ "-", "_" ]
      Array.new(length) { chars[SecureRandom.random_number(chars.size)] }.join
    end

    def encryptor(message, password1, password2 = nil)
      salt = SecureRandom.random_bytes(16)
      key = derive_key(password1, password2, salt)
      iv = SecureRandom.random_bytes(12)
      cipher = OpenSSL::Cipher.new("aes-256-gcm")
      cipher.encrypt
      cipher.key = key
      cipher.iv = iv
      encrypted_message = cipher.update(message) + cipher.final
      tag = cipher.auth_tag
      Base64.encode64(salt + iv + encrypted_message + tag)
    end

    def decryptor(encrypted_message, password1, password2 = nil)
      encrypted_data = Base64.decode64(encrypted_message)
      salt = encrypted_data[0..15]
      iv = encrypted_data[16..27]
      ciphertext = encrypted_data[28..-17]
      tag = encrypted_data[-16..]
      key = derive_key(password1, password2, salt)
      cipher = OpenSSL::Cipher.new("aes-256-gcm")
      cipher.decrypt
      cipher.key = key
      cipher.iv = iv
      cipher.auth_tag = tag
      cipher.update(ciphertext) + cipher.final
    end

    private

    def derive_key(password1, password2, salt)
      combined_password = password1 + (password2 || "")
      OpenSSL::PKCS5.pbkdf2_hmac(combined_password, salt, 100_000, 32, OpenSSL::Digest::SHA256.new)
    end
end
