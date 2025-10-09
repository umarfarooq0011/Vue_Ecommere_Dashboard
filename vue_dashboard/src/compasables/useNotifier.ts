import { Notyf } from 'notyf'
import 'notyf/notyf.min.css'

let notifier: Notyf | null = null

export function useNotifier() {
  if (!notifier) {
    notifier = new Notyf({
      duration: 2800,
      ripple: true,
      dismissible: true,
      position: { x: 'right', y: 'top' },
      types: [
        {
          type: 'warning',
          background: '#f59e0b',
          icon: {
            className: 'mdi mdi-alert',
            tagName: 'i',
          },
        },
      ],
    })
  }

  return notifier
}