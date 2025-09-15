require "test_helper"

class MessageTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper
  def setup
    @message = Message.new(
      views_remaining: 10,
      encrypted_content: "encrypted content",
    )
  end

  test "should be valid with valid attributes" do
    assert @message.valid?
  end

  test "should not be valid with views_remaining less than 1" do
    @message.views_remaining = 0
    assert_not @message.valid?
  end

  test "should not be valid with views_remaining greater than 50" do
    @message.views_remaining = 51
    assert_not @message.valid?
  end

  test "should not be valid with expiration_time beyond limit" do
    @message.expiration_time = Time.current + Message::MAX_ALLOWED_TIME + 1.day
    assert_not @message.valid?
  end

  test "should set defaults before create" do
    @message.save
    assert_not_nil @message.id
  end

  test "should auto delete expired messages" do
    @message.expiration_time = Time.current - 1.day
    @message.save
    # fixtures has 2 messages + this one
    assert_difference("Message.count", -3) do
      Message.auto_delete_expired
    end
  end

  test "should destroy message if it has expired" do
    @message.expiration_time = Time.current - 1.day
    @message.save
    assert @message.has_expired
    assert_difference("Message.count", -1) do
      @message.auto_delete_expired
    end
  end
end
