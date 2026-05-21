## Canvas 2.0 React Migration Audit

### Reference object
- Source of truth: `banana/frontend-vue3/src/views/canvas/Sora2WorkflowCanvas.vue`
- Supporting layers:
  - `frontend-vue3/src/composables/workflow/*`
  - `frontend-vue3/src/components/canvas/sora2/*`
  - `frontend-vue3/src/api/canvas2Collaboration.js`

### Current React status
- Done:
  - Load workflow detail by `GET /api/sora2-workflow/:id`
  - Render `nodes / edges / viewport` with React Flow
  - Basic node selection, drag, connect, delete
  - Save full `canvas_nodes` back by `PUT /api/sora2-workflow/:id`
  - Preserve unknown `canvas_nodes` fields during save
- Missing:
  - Canvas2 project list page
  - Node-specific renderers and editors
  - Batch action persistence
  - Collaboration room and member UI
  - Drawer/panel ecosystem
  - Director workflow helpers
  - Media generation and polling flows

### Migration strategy
1. Stabilize React data layer and node catalog.
2. Split canvas shell into small React modules by responsibility.
3. Migrate high-frequency node types first:
   - `novelInput`
   - `storyPrompt`
   - `shotPrompt`
   - `imageNode`
   - `storyVideo`
4. Migrate lightweight persistence optimizations:
   - viewport patch
   - node position patch
   - structure batch actions
5. Migrate collaboration and annotations.
6. Migrate advanced drawers, production groups, and export flows.

### Immediate next implementation targets
- Build `canvas2` project list route in React.
- Replace generic node card with typed renderers for `storyVideo` and `imageNode`.
- Introduce React equivalents for:
  - node catalog
  - canvas serialization helpers
  - save/load orchestration
