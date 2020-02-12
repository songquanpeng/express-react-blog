'use strict';
const express = require('express');
const router = express.Router();
const Page = require('../models/page').Page;
const checkLogin = require('../middlewares/check').checkLogin;
const checkPermission = require('../middlewares/check').checkPermission;
const getDate = require('../utils/util').getDate;
const md2html = require('../utils/util').md2html;

router.put('/', checkLogin, (req, res, next) => {
  let type = req.body.type;
  let link = req.body.link;
  let page_status = req.body.page_status;
  let comment_status = req.body.comment_status;
  let title = req.body.title;
  let content = req.body.content;
  let tag = req.body.tag;
  let password = req.body.password;
  let user_id = req.session.user.id;
  let post_time = getDate();
  let edit_time = post_time;
  let view = 0;
  let up_vote = 0;
  let down_vote = 0;
  let page = {
    user_id,
    type,
    link,
    page_status,
    post_time,
    edit_time,
    comment_status,
    title,
    content,
    tag,
    password,
    view,
    up_vote,
    down_vote
  };
  Page.add(page, (status, message, id) => {
    res.json({ status, message, id });
  });
});

router.get('/', checkLogin, (req, res, next) => {
  Page.all((status, message, pages) => {
    res.json({ status, message, pages });
  });
});

router.get('/:id', checkLogin, (req, res, next) => {
  const id = req.params.id;
  Page.getById(id, (status, message, page) => {
    res.json({ status, message, page });
  });
});

router.post('/', checkLogin, (req, res, next) => {
  const id = req.body.id;
  let type = req.body.type;
  let link = req.body.link;
  let page_status = req.body.page_status;
  let comment_status = req.body.comment_status;
  let title = req.body.title;
  let content = req.body.content;
  let tag = req.body.tag;
  let password = req.body.password;
  let edit_time = getDate();

  let page = {
    type,
    link,
    page_status,
    edit_time,
    comment_status,
    title,
    content,
    tag,
    password
  };

  Page.updateById(id, page, (status, message) => {
    res.json({ status, message });
  });
});

router.delete('/:id', checkLogin, (req, res, next) => {
  const id = req.params.id;
  Page.delete(id, (status, message) => {
    res.json({ status, message });
  });
});
module.exports = router;