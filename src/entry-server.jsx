import { renderToString } from 'react-dom/server'
import Site from './components/Site.jsx'

export function render(stats) {
  return renderToString(<Site stats={stats} />)
}
