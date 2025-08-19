# TMA

## For local development, run 

Create ngrok.yml file in twa folder format
```yml
version: 2
authtoken: <YOUR NGROK TOKEN>
tunnels:
    vite:
        proto: http
        addr: 5173
        domain: <YOUR NGROK DOMAIN>
```

link <YOUR NGROK DOMAIN> to your test tg bot mini app in botfather
@tonkeeper_test_dont_use_localbot

1. `yarn start`
2. `yarn ngrok`
3. open your tg bot mini app

## For dev deployment, run
`yarn deploy:dev`

## For prod deployment, run
`yarn deploy`
