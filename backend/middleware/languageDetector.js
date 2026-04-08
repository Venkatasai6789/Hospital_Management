const languageDetector = (req, res, next) => {
    // Get language from header, default to English if missing
    const lang = req.headers['x-lang'] || 'en';
    // Simple check to support 'ta' (Tamil) or 'en' (English)
    req.language = lang.startsWith('ta') ? 'ta' : 'en';
    console.log(`[Middleware] Request Language: ${req.language}`);
    next();
};

export default languageDetector;
