require "simplecov"
SimpleCov.start "rails" do
  add_filter "/bin/"
  add_filter "/db/"
  add_filter "/spec/"
  add_filter "/test/"

  # Set minimum coverage percentage
  # minimum_coverage 90
end
