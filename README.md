# Container Orchestrator

This container orchestrator written in pure JavaScript (solely built for NodeJS environment) that mimics the idea of Swarm or Kubernetes running on Docker. By simply installing npm dependencies and running `npm run start` some predefined cluster and it's nodes are created. Starting from which, using the RESTful endpoints given beneath, further control is possible. In this initial setup only one instance of cluster is created, although multiple clusters is supported.

# Task list
- [x] create boilerplate of RESTful api
- [x] create the main Orchestrator, Cluster, Node classes
- [x] utilize liferaft libraray (implementation of Raft consensus algorithm)
- [x] implement mechanism that allows to cut specific node-to-node connections
- [x] handle event of elected leader, forward it to a cluster
- [x] spread /service endpoint command using the reference to the leader elected
- [x] implement <cluster>/nodes POST enpoint that allows to add new node
- [x] implement <cluster>/nodes DELETE enpoint that allows to remove selected node from a cluster
- [ ] employ sophisticated way of creating replicas inside the nodes based on their current load
- [ ] cover the case when two nodes from the same cluster report themselves as leader
- [x] build a queue of service calls (only one service call on one leader at a time)
- [ ] expose log entries through node stats
- [ ] think of nested clusters (container as a cluster)

## Development environment

Project is developed on Windows machine.
* npm 6.7.0 (also tested 6.10.1)
* node v10.15.1 (also tested v13.8.0)

### Setup

To install dependencies:
```
npm install
```
To get it running on port 8000:
```
npm run start
```
adjust PORT value inside .env file to change dev server port

## Key endpoint calls

To send a service request to the cluster:
```
curl -X POST -H "Content-Type: application/json" -d '{"container": {"uniq_id": 0, "label": "description"}, "replicas": 99}' localhost:8000/clusters/0/service
```

To get stats of a cluster id:0 (only cluster id:0 exists with this basic setup):
```
curl localhost:8000/clusters/0/stats
```

To spawn and connect a new node localhost:8099 into cluster id 0:
```
curl -X POST -H "Content-Type: application/json" -d '{"id": "custom0", "host":"localhost", "port":8099, "capacity":100, "spawn":true}' localhost:8000/clusters/0/nodes
```

To leave the cluster id 0 and shut down the node (running on localhost:8001) itself:
```
curl -X DELETE -H "Content-Type: application/json" -d '{"host": "localhost", "port": "8001"}' localhost:8000/clusters/0/nodes
```

To kill a connection from the node running on localhost:8004 to the node localhost:8002 :
```
curl -X POST -H "Content-Type: application/json" -d '{"localhost:8002": 0}' localhost:8004/connections/
```

## Orchestrator REST endpoints (using localhost:8000 as the base URL)
* **/clusters**

    method : `GET`
* **/clusters/:cluster_id**
    Returns stats of the nodes running in the cluster.

    method: `GET`

    URL param: `cluster_id=[alphanumeric]`

    - [ ] implement `PUT` | `DELETE`

## Cluster endpoints **/clusters/:cluster_id/**
* **/service**

    method: `POST`

    JSON content:

    ```
    {
        containers: [
            {
                description: "container 0",
                replicas: 10
            },
            {
                description: "container 1",
                replicas: 10
            }
        ]
    }
    ```
* **/state**

    method: `GET`

    - [] implement state of the last service call

* **/stats**
    Returns stats of the nodes running in the cluster.

    method: `GET`


### Node REST endpoints on the nodes spawned (using localhost:8001 as a base URL)
* **/**
    Returns a definition of the node

    method: `GET`

* **/connections**
    Returns the connections available for the node

    method: `GET`

* **/stats**
    Returns the stats of the given node

    method: `GET`
