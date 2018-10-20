import ExpressPromiseRouter from 'express-promise-router';
import StaticPageCacheControlMiddleware from '../middleware/StaticPageCacheControlMiddleware';
var router = ExpressPromiseRouter();

router.use(StaticPageCacheControlMiddleware);

router.get('/terms_of_service', function(req, res, next) {
  res.render('terms_of_service.html');
});

router.get('/privacy_policy', function(req, res, next) {
  res.render('privacy_policy.html');
});

router.get('/member', function(req, res, next) {
  res.render('member.html');
});

export = router;
