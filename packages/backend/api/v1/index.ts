import Router from "koa-router"
import orgs from "./orgs"
import projects from "./projects"
import datasets from "./datasets"
import evals from "./evals"
import filters from "./filters"
import runs from "./runs/index"
import templateVersions from "./templateVersions"
import templates from "./templates"
import users from "./users"
import projectUsers from "./external-users"

const v1 = new Router({
  prefix: "/v1",
})

v1.get("/", async (ctx) => {
  ctx.body = "Lunary API v1"
})

v1.use(orgs.routes())
v1.use(users.routes())
v1.use(projects.routes())
v1.use(runs.routes())
v1.use(datasets.routes())
v1.use(templates.routes())
v1.use(templateVersions.routes())
v1.use(filters.routes())
v1.use(evals.routes())
v1.use(projectUsers.routes())

export default v1
