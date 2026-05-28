ALTER TABLE "roles" ADD COLUMN "tenantId" text;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD COLUMN "reportsToId" text;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_reportsToId_users_id_fk" FOREIGN KEY ("reportsToId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "notifications_userId_idx" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_createdAt_idx" ON "notifications" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "roles_tenantId_idx" ON "roles" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "tenant_members_reportsToId_idx" ON "tenant_members" USING btree ("reportsToId");--> statement-breakpoint
CREATE INDEX "user_roles_userId_idx" ON "user_roles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_roles_tenantId_idx" ON "user_roles" USING btree ("tenantId");