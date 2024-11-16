class CreateMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :messages do |t|
      t.text :encrypted_content
      t.integer :views_remaining
      t.datetime :expiration_time
      t.string :id

      t.timestamps
    end
  end
end
