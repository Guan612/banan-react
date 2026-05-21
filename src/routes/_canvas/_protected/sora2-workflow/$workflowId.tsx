import { createFileRoute } from '@tanstack/react-router'
import { WorkflowCanvasPage } from '../../../../features/workflow/workflow-canvas-page'

export const Route = createFileRoute(
  '/_canvas/_protected/sora2-workflow/$workflowId',
)({
  component: WorkflowCanvasRoute,
})

function WorkflowCanvasRoute() {
  const { workflowId } = Route.useParams()

  return <WorkflowCanvasPage workflowId={workflowId} />
}
