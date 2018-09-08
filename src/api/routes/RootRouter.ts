import ExpressPromiseRouter from 'express-promise-router';
import NonApiRouter = require('./NonApiRouter');
import ApiRouter = require('./ApiRouter');

let router = ExpressPromiseRouter();

router.use(function(req, res) {
  req['context'] = {};
  return Promise.resolve('next');
})
router.use('/', NonApiRouter);
router.use('/', ApiRouter);

export = router;
