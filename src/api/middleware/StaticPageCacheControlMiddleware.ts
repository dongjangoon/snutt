export default function(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return Promise.resolve('next');
}
