import { checkAccess } from "@/src/utils/authorization";
import sql from "@/src/utils/db";
import { clearUndefined } from "@/src/utils/ingest";
import Context from "@/src/utils/koa";
import Router from "koa-router";

import { z } from "zod";

const dashboards = new Router({
  prefix: "/dashboards",
});

const dashboardschema = z.object({
  name: z.string(),
  charts: z.any(),
  description: z.string().optional(),
});

dashboards.get("/", checkAccess("dashboards", "list"), async (ctx: Context) => {
  const { projectId } = ctx.state;

  ctx.body = await sql`select * from dashboard
        where project_id = ${projectId} 
        order by updated_at desc`;
});

dashboards.get("/:id", checkAccess("dashboards", "read"), async (ctx: Context) => {
  const { projectId } = ctx.state;
  const { id } = ctx.params;

  const [dashboard] =
    await sql`select * from dashboard where project_id = ${projectId} and id = ${id}`;

  ctx.body = dashboard;
});

dashboards.post("/", async (ctx: Context) => {
  const { projectId, userId } = ctx.state;

  const validatedData = dashboardschema.parse(ctx.request.body);
  const { name, charts, description } = validatedData;

  const [insertedCheck] = await sql`
    insert into dashboard ${sql({
      name,
      ownerId: userId,
      projectId,
      charts,
      description
    })}
    returning *
  `;
  ctx.body = insertedCheck;
});

dashboards.patch("/:id", async (ctx: Context) => {
  const { projectId } = ctx.state;
  const { id } = ctx.params;

  const validatedData = dashboardschema.partial().parse(ctx.request.body);
  const { name, charts, description } = validatedData;

  const [updateddashboard] = await sql`
    update dashboard
    set ${sql(clearUndefined({ name, charts, description, updatedAt: new Date() }))}
    where project_id = ${projectId}
    and id = ${id}
    returning *
  `;
  ctx.body = updateddashboard;
});

dashboards.delete(
  "/:id",
  checkAccess("dashboards", "delete"),
  async (ctx: Context) => {
    const { projectId } = ctx.state;
    const { id } = ctx.params;

    await sql`
    delete from dashboard
    where project_id = ${projectId}
    and id = ${id}
    returning *
  `;

    ctx.status = 200;
  },
);

export default dashboards;
