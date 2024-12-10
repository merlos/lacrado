require "test_helper"

class ExpireMessageJobTest < ActiveJob::TestCase
  def setup
     ActiveJob::Base.queue_adapter = :test
     @message = Message.create!(
      views_remaining: 10,
      encrypted_content: "encrypted content",
      expiration_time: Time.current + 1.day
     )
  end
  test "job is enqueued with correct time" do
    # find the message that was created
    assert_enqueued_with(job: ExpireMessageJob, args: [ @message.id ]) do
      ExpireMessageJob.perform_later(@message.id)
    end
  end

  test "job performs and deletes expired message" do
    @message.update(expiration_time: Time.current - 1.day)
    assert_difference("Message.count", -1) do
      ExpireMessageJob.perform_now(@message.id)
    end
  end

  test "job performs and does not delete non-expired message" do
    assert_no_difference("Message.count") do
      ExpireMessageJob.perform_now(@message.id)
    end
  end

  test "job does nothing if message does not exist" do
    assert_nothing_raised do
      ExpireMessageJob.perform_now(-1)
    end
  end
end
