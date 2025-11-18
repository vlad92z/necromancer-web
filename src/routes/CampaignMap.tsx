/**
 * CampaignMap - Future feature: Boss selection and progression visualization
 * Currently inaccessible stub
 */

export function CampaignMap() {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '20px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '16px',
  }

  const messageStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#aaaaaa',
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Campaign Map</h1>
      <p style={messageStyle}>Coming Soon: Boss selection and campaign progression</p>
    </div>
  )
}
