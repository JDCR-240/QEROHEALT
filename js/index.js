


function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('mobile-menu-btn');
    const isHidden = menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', !isHidden);
}

function switchProfile(profile) {
    const profiles = ['paciente', 'cuidador', 'especialista'];
    const names = { paciente: 'Paciente', cuidador: 'Cuidador', especialista: 'Especialista' };

    profiles.forEach(p => {
        const tab = document.getElementById(`tab-${p}`);
        const badge = document.getElementById(`badge-${p}`);
        const panel = document.getElementById(`panel-${p}`);

        if (p === profile) {
            tab.classList.add('active-tab');
            tab.setAttribute('aria-selected', 'true');
            badge.classList.remove('hidden');
            panel.classList.remove('hidden');
        } else {
            tab.classList.remove('active-tab');
            tab.setAttribute('aria-selected', 'false');
            badge.classList.add('hidden');
            panel.classList.add('hidden');
        }
    });

}

function toggleFaq(index) {
    const content = document.getElementById(`faq-content-${index}`);
    const icon = document.getElementById(`faq-icon-${index}`);
    const isHidden = content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
    
    const btn = content.previousElementSibling;
    if (btn) btn.setAttribute('aria-expanded', !isHidden);
}

function handleSupportSubmit(e) {
    e.preventDefault();
    document.getElementById('support-feedback').classList.remove('hidden');
    e.target.reset();
}