class CreateMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :messages, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.text :encrypted_content, null: false
      t.boolean :password2_present, null: false, default: false
      t.integer :views_remaining, null: false, default: 1
      t.datetime :expiration_time, null: true
      t.timestamps
    end
    add_index :messages, :id, unique: true
  end
end
