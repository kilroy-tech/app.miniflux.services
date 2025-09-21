# <img src="logo.png" width="48"> Miniflux Services

**miniflux.services** is a Kilroy app that implements an incoming webhook for integrating with the [Miniflux RSS server](https://miniflux.app). It receives incoming
RSS stories from Miniflux and passes them to a Kilroy swarm for use in ```kilroy.ai.services``` pipelines and other Kilroy applications.

Configure the webhook integration in Miniflux to use a URL like: 
```
http://localhost:3000/api/v1/pd/webhook/MINIFLUX/miniflux.services.config/listener_raw
```

If necessary, replace "localhost" with network address or domain name of the computer running Kilroy. This is required if Miniflux is running
inside a Docker container or on a different host from Kilroy.

**NOTE**: for greater security, you should replace "MINIFLUX" in the webhook URL with a unique value that matches the "API Token" field in the
```miniflux.services``` configuration dialog. If the token in the URL and the token in the config settings do not match, webhook messages sent to
Kilroy from Miniflux (or anywhere else) will be ignored.

## Getting Started
Use the "gear" icon to change the settings, supplying an appropriately unique swarm name for use by your AI pipelines. Note that this MUST be the name
of a public ```kilroy.ai.services``` swarm (i.e., "public" checkbox selected on the swarm in the Pipeline Editor).

Add this public swarm to any pipelines that want to receive RSS stories from Miniflux. Best practices are to treat this swarm as read-only and do not
output any additional messages from agents into this swarm.

You can also change the ```API Token``` to a private value that matches the API token value in the webhook URL, as described above.