define(["app/dom", "app/config", "app/api"], function($, config, api) {

    "use strict";

    var isso = null;
    var requestedSDK = false;
    var loadedSDK = false;
    var loginRequest = false;
    var loggedIn = false;
    var authorData = null;
    var gAuth = null;

    var init = function(isso_ref) {
        if (!config["google-enabled"]) {
            return;
        }

        isso = isso_ref;

        var method = JSON.parse(localStorage.getItem("login_method"));
        if (method == "google") {
            loadSDK(false);
        }
    }

    var loadSDK = function(activeClick) {
        if (requestedSDK) {
            if (activeClick) {
                if (loadedSDK) {
                    gAuth.signIn();
                } else {
                    loginRequest = true;
                }
            }
            return;
        }

        requestedSDK = true;
        loginRequest = activeClick;

        var gScriptEl = document.createElement("script");
        gScriptEl.src = "https://apis.google.com/js/platform.js";
        document.head.appendChild(gScriptEl);
        gScriptEl.addEventListener('load', function (e) {
            gapi.load('auth2', function() {
                gAuth = gapi.auth2.init({
                    client_id: "41900040914-qfuks55vr812m25vtpkrq6lbahfgg151.apps.googleusercontent.com",
                    cookiepolicy: "single_host_origin",
                });
                gAuth.isSignedIn.listen(signedinChanged)
                loadedSDK = true;
                if (loginRequest) {
                    gAuth.signIn();
                }
            });
        });
    }

    var signedinChanged = function(signedin) {
        if (signedin) {
            var user = gAuth.currentUser.get();
            var profile = user.getBasicProfile();
            loggedIn = true;
            authorData = {
                uid: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail() || "",
                pictureURL: profile.getImageUrl(),
                idToken: user.getAuthResponse().id_token,
            };
            localStorage.setItem("login_method", JSON.stringify("google"));
            isso.updateAllPostboxes();
        } else {
            loggedIn = false;
            authorData = null;
            localStorage.removeItem("login_method");
            isso.updateAllPostboxes();
        }
    }

    var updatePostbox = function(el) {
        if (loggedIn) {
            $(".auth-not-loggedin", el).hide();
            $(".auth-loggedin-google", el).showInline();
            $(".auth-google-name", el).innerHTML = authorData.name;
            $(".isso-postbox .avatar", el).setAttribute("src", authorData.pictureURL);
            $(".isso-postbox .avatar", el).show();
        } else {
            $(".auth-loggedin-google", el).hide();
            $(".social-login-link-google", el).showInline();
            $(".social-login-link-google > img", el).setAttribute("src", api.endpoint + "/images/googleplus-color.png");
        }
    }

    var initPostbox = function(el) {
        if (!config["google-enabled"]) {
            return;
        }
        updatePostbox(el);
        $(".social-logout-link-google", el).on("click", function() {
            gAuth.signOut();
        });
        $(".social-login-link-google", el).on("click", function() {
            loadSDK(true);
        });
    }

    var isLoggedIn = function() {
        return loggedIn;
    }

    var getAuthorData = function() {
        return {
            network: "google",
            id: authorData.uid,
            idToken: authorData.idToken,
            pictureURL: authorData.pictureURL,
            name: authorData.name,
            email: authorData.email,
            website: "",
        };
    }

    var prepareComment = function(comment) {
        comment.website = "//plus.google.com/" + comment.social_id + "/posts";
    }

    return {
        init: init,
        initPostbox: initPostbox,
        updatePostbox: updatePostbox,
        isLoggedIn: isLoggedIn,
        getAuthorData: getAuthorData,
        prepareComment: prepareComment
    };

});
