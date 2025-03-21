if (typeof window.turnstileCallback === 'function') {
    window.turnstileCallback(document.querySelector('.twcpt-turnstile-helper input').value);
}