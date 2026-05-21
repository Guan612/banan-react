import { createFileRoute } from '@tanstack/react-router'
import { WorkflowProjectsPage } from '../../../../features/workflow/workflow-projects-page'

export const Route = createFileRoute('/_app/_protected/sora2-workflow/')({
  component: WorkflowProjectsRoute,
})

function WorkflowProjectsRoute() {
  return <WorkflowProjectsPage />
}
