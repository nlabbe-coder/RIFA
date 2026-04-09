import RifaClient from './RifaClient'

export default async function RifaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RifaClient id={id} />
}
