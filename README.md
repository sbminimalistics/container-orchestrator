# Container Orchestrator

This container orchestrator written in pure JavaScript (solely built for NodeJS environment) that mimics the idea of Swarm or Kubernetes running on Docker. By simply installing the dependencies and running `npm run start` some predefined set of clusters and their nodes is created. Starting from which, using the RESTful endpoints given beneath, further control is possible. In this initial setup only one instance of cluster is created, although multiple clusters is supported.

# Task list
- [x] create boilerplate of RESTful api
- [x] create the main Orchestrator, Cluster, Node classes
- [x] utilize liferaft libraray (implementation of Raft consensus algorithm)
- [x] implement mechanism that allows to cut specific node-to-node connections
- [x] handle event of elected leader, forward it to a cluster
- [x] spread /service endpoint command using the reference to the leader elected
- [] employ sophisticated way of creating replicas inside the node based on their current load
- [] cover the case when two nodes from the same cluster report themselves as leader
- [] build a queue of service calls (only one service call on one leader at a time)
- [] expose log entries through node stats
- [] think of nested clusters (container as a cluster)

## Development environment

Project is developed on Windows machine.
* npm 6.7.0
* node v10.15.1 (also tested on v13.8.0)

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
* these requests should be called after a leader is elected (takes 2-5 seconds after start)
To get stats of a cluster id:0 (only cluster id:0 exists with this basic setup):
```
curl localhost:8000/clusters/0/stats
```
To send a service request using a leader of the cluster:
```
curl -X POST -H "Content-Type: application/json" -d '{"container": {"id": 5, "replicas": 25}}' localhost:8000/clusters/0/service
```

# RESTful endpoints
## Orchestrator endpoints **<host>/**
* **/clusters**

    method : `GET`
* **/clusters/:cluster_id**

    method: `GET` | `PUT` | `DELETE`

    URL param: `cluster_id=[alphanumeric]`

## Cluster endpoints **<host>/clusters/:cluster_id/**
* **/service**

    method: `POST`

    content:

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
* **/stats**

    method: `GET`

Quick example for sending sending json using cURL: curl -i -X POST -H "Content-Type: application/json" -d '{"key":"val"}' http://localhost:8000/clusters/0/connections
