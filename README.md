# Container Orchestrator

This container orchestrator written in pure JavaScript that mimics the idea o Swarm or Kubernetes running on Docker. For the time being only the development version is available. Buy simply running `npm run start` some predefined set of clusters and their nodes is created. Based on which, using the RESTful endpoints given beneath, further control is possible. In this setup only one instance of orchestrator is created.

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

## Development environment

Project is developed on Windows machine.
* npm 6.7.0
* node v10.15.1

### Setup

```
npm i
```

### Dev Start

To get it running on port 8000:
```
npm run start
```
adjust PORT value inside .env file to change dev server port
