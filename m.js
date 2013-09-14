File = new Meteor.Collection("files");
Annotations = new Meteor.Collection('annotations');

if (Meteor.isClient) {
    Session.set("creatingNewFile", false);
    Meteor.startup(function() {
      Meteor.Router.add({
        '/': 'home',
        '/new': 'newFile',
        '/github': 'github',
        '/show/:id': function(id) {
          Session.set('fileID', id);
          return 'show';
        } 
      });
      setTimeout(function() {
        Meteor.Router.to(window.location.pathname)
      }, 500)
    }); 

    Template.newFile.events({
      'click #submit-new-file' : function(ev, page) {
        var textbox = $('#newFileEntry');
        var titlebox = $('#title');
        var file = $(textbox).val();
        var title = $(titlebox).val();
        if (file === "") return;

        var language = hljs.highlightAuto(file).language;

        File.insert({ 
          'file' : $.trim(file), 
          shared: [], 
          author: Meteor.userId, 
          language: language,
          title: title
        }, function(error, result) {
          if (error) {
            alert('An unknown error occurred');
          } else {
            Meteor.Router.to('/show/' + result);
          }
        });
      },

      'keydown #newFileEntry' : function(ev, page) {
        console.log(ev);
        if(ev.keyCode==9) {
          ev.preventDefault();
          insertAtCaret("newFileEntry","    ");
        }
      }

    });

    $(document).click(function() {
      $(".annotations").hide();
      Session.set('annotations', false);
    });

    Template.annotations.events({
      'click *' : function(ev) {
        ev.stopPropagation();
      }
    });

    Template.show.events({
      'click .line' : function(ev) {
        $(".annotations").show();
        $target = $(ev.target).parents('.line');
        var lineId = $target.data('id');
        Session.set('lineAnnotationNumber', lineId);

        var $line = $target.find('code'),
          $container = $('.snippet');

        $target.find('pre').addClass('selected');

        Session.set('Source.Annotation.annoCSS', {
          top: $line.offset().top + $line.height() / 2,
          left: $container.position().left + $container.width(),
          overflow: "display",
          width: $(window).width() - $container.offset().left - $container.width()
        });

        $('.annotations').css(Session.get('Source.Annotation.annoCSS'));

        ev.stopPropagation();
      },
      'keydown #annotation' : function(ev) {
        var keyCode = ev.keyCode || ev.which;
        if ( keyCode == 13 ) {
          Annotations.insert({ 
            author: Meteor.user(), 
            file: Session.get('fileID'),
            line: Session.get('lineAnnotationNumber'),
            text: $("#annotation").val()
          }, function(error, result) {
            if (error) {
              alert("An unknown error has occurred");
            } else {
              $("#annotation").val('');
              $('.annotations').show().css(Session.get('Source.Annotation.annoCSS'));;
              ev.preventDefault();
              ev.stopPropagation();
            }
          });
        }
      }
    });

    Template.annotation.events({
      'click .edit' : function(ev) {
        Session.set("Source.Annotation.editing", $(ev.target).data('id'));
      },
      'keydown textarea' : function(ev) {
        var keyCode = ev.keyCode || ev.which;
        if (keyCode == 13) {
          var text = $(ev.target).val();
          Session.set("Source.Annotation.editing", null);
          Annotations.update( $(ev.target).data('id'),{$set : {text: text } });
        }
      }
    });

    Template.user.loggedIn = Template.home.loggedIn = function() {
      return Meteor.userId();
    }

    Template.home.creatingNewFile = function() {
      return Session.get('creatingNewFile');
    }

    Template.annotation.canEdit = function(annotation) {
      return Meteor.userId() == annotation.author._id;
    }

    Template.annotation.editing = function(annotation) {
      return Session.get("Source.Annotation.editing") == annotation._id;
    }

    Template.annotations.annos = function() {
      return Annotations.find({
        'line': Session.get('lineAnnotationNumber'), 
        'file': Session.get('fileID')
      }).fetch();
    }

    Template.annotations.hasAnnotations = function() {
      return Template.annotations.annos().length !== 0;
    }

  Template.github.username = function() {
    return Meteor.user().profile.username;
  }

  SessionAmplify = _.extend({}, Session, {
    keys: _.object(_.map(amplify.store(), function(value, key) {
      return [key, JSON.stringify(value)]
    })),
    set: function (key, value) {
      Session.set.apply(this, arguments);
      amplify.store(key, value);
    },
  });

	Handlebars.registerHelper('numberLines', function(obj) {
		result = [];
		var lineCount = 0;
		_.each(obj, function(line){
			result.push({name:line, value:lineCount});
			lineCount++;
		});
		return result;
	});

  Template.user.events({
    'click #signin,#propic' : function(ev, page) {
      var loggedIn = SessionAmplify.get("loggedIn");
      if(loggedIn) {
        SessionAmplify.set("loggedIn",false);
      } else {
        Meteor.loginWithGithub({
          requestPermissions: ['user', 'public_repo']
        }, function (err) {
          if (err) {
            Session.set('errorMessage', err.reason || 'Unknown error');
          } else {
            // get the user's avatar
            HTTP.call("GET", "https://api.github.com/user?access_token="+
              Meteor.user().services.github.accessToken,
              function (error, result) {
                if (result.statusCode === 200) {
                  SessionAmplify.set("propic", result.data.avatar_url);
                  SessionAmplify.set("loggedIn",true);
                  Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.propic":result.data.avatar_url}})
                  Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.username":Meteor.user().services.github.username}})
                }
            });
          }
        });
      }
    }
  })


  Template.user.URL = function() {
    return SessionAmplify.get('propic');
  }

  Template.user.loggedIn = function() {
    return SessionAmplify.get("loggedIn");
  }

  Template.show.splitLines = function() {
  	var file = File.find(Session.get('fileID')).fetch()[0];
  	var lines = File.find(Session.get('fileID')).fetch()[0].file.split("\n"),
    	resultsArray = [];
    	_.each(lines, function(line) {
        var cssClasses = "";
        if (line != "") {
          cssClasses += "line";
          if (Annotations.find({
                  'line': resultsArray.length, 
                  'file': Session.get('fileID')
                }).fetch().length > 0) {
            cssClasses += " annotated";
          }
        }
        else {
          cssClasses += "emptyLine";
        }
    		resultsArray.push({text: line, index: resultsArray.length, language: file.language, cssClasses: cssClasses});
    	});
    	return resultsArray;
  }

  Template.show.rendered = function() {
    Prism.highlightAll();
  }

  Template.home.userSources = function() {
    return File.find({ author: Meteor.userId() }).fetch();
  }

  Template.home.sharedSources = function() {
    var sources = File.find().fetch(),
      resultsArray = [];
    for (var i=0, l=sources.length; i<l; i++) {
      if (_.contains(sources[i].shared, Meteor.userId() )) {
        resultsArray.push(sources[i]);
      }
    }
    return resultsArray;
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

    // set up the OAuth2 service
    Accounts.loginServiceConfiguration.remove({
      service: "github"
    });
    Accounts.loginServiceConfiguration.insert({
      service: "github",
      clientId: process.env.GITHUB_ID,
      secret: process.env.GITHUB_SECRET
    });

    Meteor.users.allow({
      update: function (userId, user, fields, modifier) {
        // can only change your own documents
        if(user._id === userId)
        {
          Meteor.users.update({_id: userId}, modifier);
          return true;
        }
        else return false;
      }
    });

  });
}

// needed for tab to work
function insertAtCaret(areaId,text) {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
      "ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") { 
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart ('character', -txtarea.value.length);
      strPos = range.text.length;
    }
    else if (br == "ff") strPos = txtarea.selectionStart;

    var front = (txtarea.value).substring(0,strPos);  
    var back = (txtarea.value).substring(strPos,txtarea.value.length); 
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") { 
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart ('character', -txtarea.value.length);
      range.moveStart ('character', strPos);
      range.moveEnd ('character', 0);
      range.select();
    }
    else if (br == "ff") {
      txtarea.selectionStart = strPos;
      txtarea.selectionEnd = strPos;
      txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
}
