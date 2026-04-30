import { useState } from 'react'
import Nav from './components/Nav'
import Home from './pages/Home'

type Page = 'home'

export default function App() {
  const [page] = useState<Page>('home')

  return (
    <>
      <Nav />
      <main>
        {page === 'home' && <Home />}
      </main>
    </>
  )
}
