/* GET home page. */
exports.index = function(req, res) {
    var view = req.host + '/index';
    res.render(view, { title: 'Chat với người lạ' }, function(err, html) {
        if (err) {
            res.render('index',  { title: 'Chat với người lạ' });
        }

        res.send(html);
    });
};
