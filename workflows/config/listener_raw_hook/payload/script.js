/**
 * miniflux.services/config/listener_raw_hook.js - preflight/postflight functions for miniflux.services/config/listener_raw_hook
 * @module miniflux.services/config/listener_raw_hook
 * @file miniflux.services/config/listener_raw_hook preflight/postflight implementation
 * @author system
 * @copyright Copyright ©2025, Concluent Systems, LLC. All rights reserved.
 */
"use strict";
const MODULE_NAME = "workflow:miniflux.services/config/listener_raw_hook";
const debug = require('debug')(MODULE_NAME);
debug.log = console.info.bind(console); //https://github.com/visionmedia/debug#readme
const Promise = require("bluebird"); // jshint ignore:line
const appRoot = global.REBAR_NAMESPACE.__base; //require ('app-root-path');
const moment    = require('moment');

//-----------------------------------------------------

function _sendToSwarm (authData, wfProxy, swarm, id, agent, user, data, type) {
    debug (`sendToSwarm: ${data.title}`);
    let resp = {
        from: agent,
        id: id, //pass this through so AI_agent context resets can find the originator
        args: [
                {
                    username: user,
                    text: JSON.stringify (data),
                    timestamp: Date.now (),
                    type: type
                }
            ]
    };
    
    let params = {
                    "command": "publish",
                    "command_args": {
                        "alias": id,
                        "topic": swarm,
                        "data": {
                            "type": "value",
                            "arg": resp
                        }
                    }
                };
    return wfProxy.CallServerBlock (authData, "swarm_command", params);
//    return Promise.resolve (`**${data.title}**\n\n`);
}

//-----------------------------------------------------

function preflight(authData, wfProxy) {
	//called before the workflow steps run
    debug ("##$ preflight");
    const TEXT_MARKER = "{{text}}";
    const wha = wfProxy.getGlobalValue ("webhook_args");
    const tAgentName = wfProxy.getGlobalValue ("ta_agent_name");;
    const tUserName = tAgentName;
    const tSwarm = wfProxy.getGlobalValue ("ta_swarm");
    const tid = wfProxy.getGlobalValue ("pd_alias");
    const api_token = wha._api_token;
    const ta_api_key = wfProxy.getGlobalValue ("ta_api_key");
    let tPublish =true;
    let data = null; //the value we apply the regex to
    let dataType = "application/json";
    let resp = {};
    
    let ctime = moment().format ("LTS");
    
    try {
        data = wha || {};

debug (`data is ${data}, publish: ${tPublish}`);
        dataType = "application/json";
    }
    catch (err) {
        debug (`##$ Bad data in args: ${err}`);
        data = null;
        tPublish = false;
    }
    
    if (api_token !== ta_api_key) {
        debug (`ERROR! Bad API token received: ${api_token} at ${ctime}`);
        wfProxy.setGlobalValue ("ta_msg",`ERROR! Bad API token received: ${api_token}`);
        tPublish = false;
    }

    try {
        if (tPublish) {
            let event_type = data.event_type;
            
            let title = "RSS Feed";
            try {
                title = data.feed.title;
            }
            catch (err) {};
            
            if (event_type == "new_entries") {
                let num_stories = data.entries.length || 0;
                debug (`Processing ${num_stories} stories`);
                let promises = [];
                for (let i=0; i<num_stories; i++) {
                    let p = _sendToSwarm (authData, wfProxy, tSwarm, tid, tAgentName, tUserName, data.entries[i], dataType);
                    promises.push (p);
                }
                return Promise.all (promises).then (results=>{
                    debug (`resolving promises: ${results.length}`);
                    tPublish = false; // we send everything inside here, so no need for wf_agent code to send anything
                    wfProxy.setGlobalValue ("story_count", num_stories);
                    wfProxy.setGlobalValue ("ta_msg",`Received ${num_stories} stories from ${title} at ${ctime}`);
                	return Promise.resolve({success: true});
                 });
            }
            else {
                debug (`##$ Not a proper message from Miniflux!`);
                wfProxy.setGlobalValue ("ta_msg",`ERROR! Unknown Miniflux event: ${event_type} at ${ctime}`);
            }
        }
    }
    catch (err) {
        debug (`ERROR: processing stories ${err}`);
        wfProxy.setGlobalValue ("ta_msg",`ERROR: processing stories ${err}`);
    }
    
    wfProxy.setGlobalValue ("story_count", 0);
	return Promise.resolve({success: true});
  
}

//-----------------------------------------------------

function begin (authData, wfProxy, step, theForm) {
	//called to load/preconfigure/define a form by ID passed in step.args.formID
    debug ("begin formID:" + step.args.formID);
    return new Promise( function(resolve, reject){
        try {
			var formObj = theForm; //any form from the workflow def is passed here
			var formData = wfProxy.getGlobalValue ("formData"); // key/value object overriding field defaults
            var formErrors = wfProxy.getGlobalValue('formErrors'); // errors from a previous form submission

			// do work here to pre-populate fields, or to generate dynamic forms, etc.
			
            return resolve({
                success: true,
                args: {
                    form: formObj,
                    formValues: formData,
                    formErrors: formErrors
                }
            });
        } catch(err){
            debug ("begin err: " + err);
            return reject(err);
        }
    });
}

//-----------------------------------------------------

function end (authData, wfProxy, step, formData) {
	// called to postprocess form data, persist it, etc. before returning results to workflow
    var result = {
            success: true,
            path: wfProxy.PATH_SUCCESS,
            args: formData
        };
    debug ("end: " + step.args.formID);
    
    //do whatever field validation, database saves, etc. required, then return result
    
    return Promise.resolve(result);
}

//-----------------------------------------------------

function postflight(authData, wfProxy) {
    debug ("postflight");
    return Promise.resolve({success: true});
}


//-----------------------------------------------------

function terminate (authData, wfProxy) {
	//perform any cleanup or rollback required if a workflow is terminated without completing
	try {
		debug ("terminate");
		return Promise.resolve ({success: true});
	}
	catch (err) {
		debug ("terminate exception : " + JSON.stringify (err));
		return Promise.resolve ({success: false});
	}
}

module.exports = {
    preflight: preflight,
    postflight: postflight,
    begin: begin,
    end: end,
    terminate: terminate
};

