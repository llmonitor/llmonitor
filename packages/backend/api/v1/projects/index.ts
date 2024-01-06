import Router from "@koa/router"
import datasets from "./datasets"
import logs from "./logs"
import users from "./users"
import templates from "./templates"
import filters from "./filters"
import evals from "./evals"

const project = new Router({
  prefix: "/project/:projectId",
})

project.use(logs.routes())
project.use(users.routes())
project.use(datasets.routes())
project.use(templates.routes())
project.use(filters.routes())
project.use(evals.routes())

export default project
