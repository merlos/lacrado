class CreateMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :messages, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.text :encrypted_content, null: false
      t.integer :views_remaining, null: false, default: 1
      t.datetime :expiration_time
      t.timestamps
    end
    add_index :messages, :id, unique: true
  end
end
