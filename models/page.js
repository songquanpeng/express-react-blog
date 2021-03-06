const db = require('../utils/database').db;
const uuid = require('uuid/v1');

class Page {
  constructor() {
    this.pages = [];
    this.loadPages();
  }

  all(callback) {
    db('pages')
      .select([
        'pages.id as page_id',
        'pages.user_id as author_id',
        'type',
        'link',
        'page_status',
        'comment_status',
        'post_time',
        'edit_time',
        'title',
        // 'content',
        'tag',
        'view',
        'up_vote',
        'down_vote',
        'users.username as username',
        'users.display_name as author'
      ])
      .innerJoin('users', 'users.id', 'pages.user_id')
      .asCallback((error, pages) => {
        if (error) {
          console.error(error.message);
          callback(false, error.message, pages);
        } else {
          if (pages)
            pages.sort((a, b) => {
              return new Date(b.edit_time) - new Date(a.edit_time);
            });
          callback(true, '', pages);
        }
      });
  }

  search(keyword, type, callback) {
    let types = [];
    if (type === undefined || type === -1 || type === '') {
      types = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    } else {
      types.push(type);
    }

    db('pages')
      .select([
        'pages.id as page_id',
        'pages.user_id as author_id',
        'type',
        'link',
        'page_status',
        'comment_status',
        'post_time',
        'edit_time',
        'title',
        'tag',
        'view',
        'up_vote',
        'down_vote',
        'users.username as username',
        'users.display_name as author'
      ])
      .innerJoin('users', 'users.id', 'pages.user_id')
      .whereIn('type', types)
      .andWhere(builder => {
        builder
          .whereRaw('LOWER(link) LIKE ?', `%${keyword.toLowerCase()}%`)
          .orWhereRaw('LOWER(title) LIKE ?', `%${keyword.toLowerCase()}%`)
          .orWhereRaw('LOWER(tag) LIKE ?', `%${keyword.toLowerCase()}%`)
          .orWhereRaw('LOWER(username) LIKE ?', `%${keyword.toLowerCase()}%`)
          .orWhereRaw('LOWER(author) LIKE ?', `%${keyword.toLowerCase()}%`)
          .orWhereRaw('LOWER(post_time) LIKE ?', `%${keyword.toLowerCase()}%`)
          .orWhereRaw('LOWER(edit_time) LIKE ?', `%${keyword.toLowerCase()}%`);
        // .orWhereRaw('LOWER(content) LIKE ?', `%${keyword.toLowerCase()}%`);
      })
      .asCallback((error, pages) => {
        if (error) {
          console.error(error.message);
          callback(false, error.message, undefined);
        } else {
          callback(true, '', pages);
        }
      });
  }

  loadPages(callback) {
    db('pages')
      .select([
        'pages.id as id',
        'pages.user_id as author_id',
        'type',
        'link',
        'page_status',
        'post_time',
        'edit_time',
        'comment_status',
        'title',
        'content',
        'converted_content',
        'tag',
        'description',
        'view',
        'users.username as username',
        'users.display_name as author'
      ])
      .innerJoin('users', 'users.id', 'pages.user_id')
      .where('page_status', 1)
      .orWhere('page_status', 2)
      .asCallback((error, pages) => {
        if (error) {
          console.error(error.message);
        }
        if (pages)
          pages.sort((a, b) => {
            if (a.page_status !== b.page_status) {
              if (a.page_status < b.page_status) {
                return 1;
              } else {
                return -1;
              }
            } else {
              return new Date(b.edit_time) - new Date(a.edit_time);
            }
          });
        this.pages = pages;
        if (callback) {
          callback();
        }
      });
  }

  getByRange(start, number, callback) {
    if (this.pages) {
      callback(this.pages.slice(start, start + number));
    } else {
      this.loadPages(() => {
        callback(this.pages.slice(start, start + number));
      });
    }
  }

  getById(id, callback) {
    db('pages')
      .where('id', id)
      .asCallback((error, data) => {
        if (error) {
          console.error(error.message);
          callback(false, error.message, undefined);
        } else if (data.length === 0) {
          callback(false, `No page has id "${id}".`, undefined);
        } else {
          callback(true, '', data[0]);
        }
      });
  }

  directlyLoadPage(link, callback) {
    db('pages')
      .where('link', link)
      .then(value => {
        if (value.length !== 0) callback(value[0].converted_content);
      })
      .catch(reason => {
        console.error(reason);
      });
  }

  getByLink(link, callback) {
    let currentIndex = 0;
    let result = this.pages.find((page, index) => {
      currentIndex = index;
      return page.link === link;
    });
    if (result === undefined) {
      callback(false, `No page has link "${link}".`, undefined, undefined);
    } else {
      let prevIndex =
        currentIndex === 0 ? this.pages.length - 1 : currentIndex - 1;
      let nextIndex =
        currentIndex === this.pages.length - 1 ? 0 : currentIndex + 1;
      let links = {
        prev: {
          title: this.pages[prevIndex].title,
          link: this.pages[prevIndex].link
        },
        next: {
          title: this.pages[nextIndex].title,
          link: this.pages[nextIndex].link
        }
      };
      callback(true, '', result, links);
    }
  }

  getByTag(tag, callback) {
    db('pages')
      .whereRaw('LOWER(tag) LIKE ?', `%${tag.toLowerCase()}%`)
      .whereNot('page_status', 0)
      .asCallback((error, data) => {
        if (error) {
          console.error(error.message);
          callback(false, error.message, undefined);
        } else {
          callback(true, '', data);
        }
      });
  }

  getByTime(time, callback) {
    db('pages')
      .whereRaw('LOWER(post_time) LIKE ?', `%${time.toLowerCase()}%`)
      .whereNot('page_status', 0)
      .asCallback((error, data) => {
        if (error) {
          console.error(error.message);
          callback(false, error.message, undefined);
        } else {
          callback(true, '', data);
        }
      });
  }

  updateById(id, page, callback) {
    db('pages')
      .where('id', id)
      .update(page)
      .asCallback(error => {
        if (error) {
          console.error(error.message);
          callback(false, error.message);
        } else {
          callback(true, '');
          this.loadPages();
        }
      });
  }

  updateViewCounter(id) {
    db('pages')
      .where('id', id)
      .update({
        view: db.raw('view + 1')
      })
      .then();
  }

  add(page, callback) {
    page.id = uuid();
    db('pages')
      .insert(page)
      .asCallback(error => {
        if (error) {
          console.error(error.message);
          callback(false, error.message, undefined);
        } else {
          callback(true, '', page.id);
          this.loadPages();
        }
      });
  }

  delete(id, callback) {
    db('pages')
      .where('id', id)
      .del()
      .asCallback(error => {
        if (error) {
          console.error(error.message);
          callback(false, error.message);
        } else {
          callback(true, '');
          this.loadPages();
        }
      });
  }
}

const page = new Page();
module.exports.Page = page;
