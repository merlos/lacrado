Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "home#index"

  resources :messages, only: [ :new, :create ]

  id_regex = /[\w\-]{16}/   # Matches strings of 16 characters with letters, numbers, underscores, and dashes
  password1_regex = /[\w\-]{16}/  # Matches strings of exactly 16 characters with the same character set

  # Displats the created message
  get "/messages/:id/created", to: "messages#created", as: :created, constraints: { id: id_regex }

  # when the user visits the link the client will decrypt locally
  match "/:id/:password1", to: "messages#decrypt", via: [ :get, :post ], constraints: { id: id_regex, password1: password1_regex }, as: :decrypt

  # Client notifies server it successfully decrypted the message (no plaintext sent)
  post "/:id/mark_viewed", to: "messages#mark_viewed", constraints: { id: id_regex }
end
