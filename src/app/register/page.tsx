export default function RegisterPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center',
                  justifyContent: 'center', background: '#f9f7f4' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: '32px',
                    width: '100%', maxWidth: 440, border: '1px solid #e5e3df' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, background: '#E87A30', borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 600, fontSize: 14 }}>C</div>
          <span style={{ fontWeight: 500, fontSize: 18 }}>arlow</span>
          <span style={{ color: '#888', fontSize: 13, marginLeft: 4 }}>— Portail vendeur</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 6px' }}>
          Créez votre espace vendeur
        </h1>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 24px' }}>
          Vendez vos équipements EnR sur Carlow
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>
            Nom complet
          </label>
          <input placeholder="Paul-Emile Dours"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8,
                     border: '1px solid #e5e3df', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>
            Email professionnel
          </label>
          <input type="email" placeholder="contact@monentreprise.fr"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8,
                     border: '1px solid #e5e3df', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>
            Mot de passe
          </label>
          <input type="password" placeholder="8 caractères minimum"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8,
                     border: '1px solid #e5e3df', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <button style={{ width: '100%', padding: '10px', background: '#E87A30',
                         color: 'white', border: 'none', borderRadius: 8,
                         fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>
          Créer mon compte →
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 16 }}>
          Déjà un compte ?{' '}
          <a href="/login" style={{ color: '#E87A30', textDecoration: 'none' }}>Se connecter</a>
        </p>
      </div>
    </div>
  )
}