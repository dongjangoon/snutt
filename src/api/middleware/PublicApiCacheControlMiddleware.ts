export default function(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return Promise.resolve('next');
}
