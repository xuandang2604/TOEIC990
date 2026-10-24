/** An actionable application-boundary failure, safe to show without leaking browser internals. */
export class StudyOperationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StudyOperationError'
  }
}
