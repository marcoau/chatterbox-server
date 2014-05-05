var AppView = Backbone.View.extend({

  el: '.container',
  events: {
    'keypress .newText': 'addChat',
    'keypress .newFriend': 'addFriend',
    'keypress .newRoom': 'addRoom',
    'click .changeRoom': 'switchRoom',
    'click .unfriend': 'removeFriend',
  },
  
  initialize: function(){
    //this.render();
    this.active = true;
    this.$chats = $('.chats');
    this.$rooms = $('.roomButtons');
    this.currentRoom = 'lobby';
    this.$friends = $('.friendButtons');
    this.friends = {};
    this.rooms = {'lobby': true};
    this.username = window.location.search.slice(10);
    this.roomname = 'lobby';
    this.time = undefined;
    var that = this;

    that.fetchy();
    setInterval(function(){
      that.fetchy();
      that.updateView();
    }, 3000);

    //this.listenTo(chats, 'add', this.spamBot);
  },

  fetchy: function(){
    var that = this;
    //this.collection.reset();
    // if(this.time){
    //    var parameter = 'order=createdAt&where={"createdAt":{"$gt":{"__type":"Date","iso":"'+ this.time + '"}},"roomname":"' + this.currentRoom + '"}';
    // }else{    
    //   var parameter = 'order=-createdAt&where={"roomname":"' + this.currentRoom + '"}';
    // }
    // console.log(parameter);
    var ajaxSettings = {
      url: 'https://api.parse.com/1/classes/chatterbox/',
      contentType: 'json',
      data: {order: '-createdAt'},
      success: function (response) {
        console.log('fetchy success');
        var messages = response.results;
        if(messages.length > 0){
          var time = messages[0].createdAt;
        }
        that.collection.set(messages);
        that.time = time;
      },
      error: function (error) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.log('fetchy fail');
        console.error(error);
      }
    };
    $.ajax(ajaxSettings);
  },

  send: function(chat){
    var ajaxSettings = {
      url: 'https://api.parse.com/1/classes/chatterbox',
      contentType: 'application/json',
      type: 'POST',
      data: JSON.stringify(chat),
      success: function (data) {
        console.log('send success');
        appView.fetchy();
      },
      error: function (data) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.log('send fail');
        console.error(error);
      }
    };
    $.ajax(ajaxSettings);
  },
  
  addChat: function(e){
    if(e.keyCode === 13){
      var text = $('.newText').val();
      var chat = {
        username: this.username,
        text: text,
        roomname: this.roomname
      };
      this.send(chat);
      //this.fetchy();
      $('.newText').val('');
      console.log('add');

    }
  },
  
  addToView: function(chat){
    chat.view = new ChatView({model: chat});
    // // if(this.time === undefined){
    //   console.log('false');
      this.$chats.append(chat.view.render());
    // }else{
    //   console.log('true');
    //   this.$chats.prepend(chat.view.render());
    // // }
    // var text = chat.get('text');
    // if(text.search('/spam') !== -1){
    //   //this.spamBot(text);
    // }
  },

  updateView: function(chat){
    this.$chats.html('');
    chats.each(function(chat){
      chat.view = new ChatView({model: chat});
      this.$chats.append(chat.view.render());
    }, this);
  },

  render: function(){
    console.log('hey');
    this.$el.addClass('chats');
    $('#output').append(this.$el);
  },

  addFriend: function(e){
    var friend = $(e.target).val();
    if(e.keyCode === 13){
      if(!(friend in this.friends)){
        this.friends[friend] = true;
        var $button = $('<button class="unfriend">' + friend + '</button>');
        console.log($button);
        $('.friendButtons').append($button);
      }      
    }
    this.updateFriend();
  },

  removeFriend: function(e){
    var friend = $(e.target).text();
    delete this.friends[friend];
    $(e.target).remove();
    this.updateFriend();
  },

  updateFriend: function(){
    this.collection.each(function(chat){
      console.log(chat.view.$el);
      if(chat.get('username') in appView.friends){
        chat.view.$el.addClass('friend');
      }else{
        chat.view.$el.removeClass('friend');
      }
    });
  },

  addRoom: function(e){
    var room = $(e.target).val();
    if(e.keyCode === 13){
      if(!(room in this.rooms)){
        this.rooms[room] = true;
        var $button = $('<button class="changeRoom">' + room + '</button>');
        $('.roomButtons').append($button);
      }
    }
  },

  switchRoom: function(e){
    var room = $(e.target).text();
    this.currentRoom = room;
    this.collection.reset();
    this.$chats.html(' ');
    this.time = undefined;
    this.fetchy();
  },

  spamBot: function(text){
    if(this.active){
      console.log(text);
      var spam = text.split(' ');
      console.log(spam);
      if(spam.length > 2){
        var text = spam.slice(2).join(' ');
      }
      for(var i = 0; i < Number(spam[1]); i++){
        var message = {
          username: 'spamBot',
          text: text,
          roomname: this.roomname
        };
        this.send(message);
        console.log('spammed');
      }
      this.active = false;
      var that = this;
      setTimeout(function(){
        that.active = true;
      }, 10000);
    }
  }

});

var Chat = Backbone.Model.extend({
  initialize: function(obj){
    this.set({
      username: obj.username,
      text: obj.text,
      room: obj.roomname
    });
  },
});
var ChatView = Backbone.View.extend({
  model: Chat,
  events: {
   'click .addFriend': 'addFriend'
  },
  render: function(){
    if(this.model.get('username') in appView.friends){
      var template = _.template('<div class="chat friend"><a href="#" class="addFriend"><span class="username"><%- username %></span></a>: <%- text %>, at <%- createdAt %></div>');
    }else{
      var template = _.template('<div class="chat"><a href="#" class="addFriend"><span class="username"><%- username %></span></a>: <%- text %>, at <%- createdAt %></div>');
    }
    var that = this;
    var html = template(that.model.toJSON());
    return this.$el.html(html);
  },
  addFriend: function(){
    var friend = this.model.get('username');
    if(!(friend in appView.friends)){
      appView.friends[friend] = true;
      var $button = $('<button class="unfriend">' + this.model.get('username') + '</div>');
      console.log($button);
      $('.friendButtons').append($button);
      appView.updateFriend();
    }
  },
});

var Chats = Backbone.Collection.extend({
  model: Chat,
});

var chats = new Chats();

//tweets.add('hello');
//tweets.add('bye');
var chat = new Chat({username: 'ann', text: 'heyyo', room: 'yoyoyo'});
var chatView = new ChatView({model: chat});


var appView = new AppView({collection: chats});
