# Lacrado: share self destroying messages links

Lacrado is a simple web application that allows users to create messages that will be self destroyed either reaching a maximum number of views and/or after an expiration date.

The typical use case scenario would be to share a credential via email. Whereas if you send directly the credential, it will be stored in the Inbox permanently, by sending a self destroying message link this can be avoided (and yes, still the receiver can do crazy things...). Messaging tools such as Signal WhatsApp or Telegram support a similar feature, so, this is just an alternative.

Lacrado is a simple ruby on rails application.

    TODO -- Explain the technicalities of how lacrado works.
    TODO -- Threat model

## Development

```
git clone https://github.com/merlos/lacrado

cd lacrado/
```

Launch the service:

```
rails db:migrate
```

```
rails s
```

Open http://localhost:3000

### Tests

If a migration is updated during development
```sh
rails db:drop db:create db:migrate
```

### Deployment

    TODO 

### LICENSE

GPLv3 

