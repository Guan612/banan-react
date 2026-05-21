type IssueLike =
  | string
  | null
  | undefined
  | {
      message?: string
    }

function getIssueMessage(issue: IssueLike) {
  if (!issue) {
    return null
  }

  if (typeof issue === 'string') {
    return issue
  }

  if (typeof issue.message === 'string') {
    return issue.message
  }

  return null
}

export function getFirstFieldError(errors: unknown[] | undefined) {
  if (!errors?.length) {
    return null
  }

  for (const error of errors) {
    if (Array.isArray(error)) {
      for (const issue of error) {
        const message = getIssueMessage(issue as IssueLike)

        if (message) {
          return message
        }
      }

      continue
    }

    const message = getIssueMessage(error as IssueLike)

    if (message) {
      return message
    }
  }

  return null
}
