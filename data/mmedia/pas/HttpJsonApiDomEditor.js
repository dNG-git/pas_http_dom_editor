//j// BOF

/*
direct PAS
Python Application Services
----------------------------------------------------------------------------
(C) direct Netware Group - All rights reserved
https://www.direct-netware.de/redirect?pas;http;dom_editor

This Source Code Form is subject to the terms of the Mozilla Public License,
v. 2.0. If a copy of the MPL was not distributed with this file, You can
obtain one at http://mozilla.org/MPL/2.0/.
----------------------------------------------------------------------------
https://www.direct-netware.de/redirect?licenses;mpl2
----------------------------------------------------------------------------
#echo(pasHttpDomEditorVersion)#
#echo(__FILEPATH__)#
*/

/**
 * @module HttpJsonApiDomEditor
 */
define([ 'jquery',
         'Hammer',
         'djt/ClientStorage.min',
         'pas/ExecutingSpinner.min',
         'pas/HttpJsonApiRequest.min',
         'pas/ModalOverlay.min'
       ],
function($, Hammer, ClientStorage, ExecutingSpinner, HttpJsonApiRequest, ModalOverlay) {
	/**
	 * List of response operations that can be cached client-side.
	 *
	 * @constant
	 */
	var SUPPORTED_CACHE_OPERATIONS = [ 'append_overlay_dom', 'replace_dom', 'replace_dom_id' ];

	/**
	 * The "execute()" helper function is used for JavaScript events or static
	 * link targets.
	 *
	 * @function _pas_HttpJsonApiDomEditor_execute
	 * @global
	 *
	 * @param {string} id DOM node ID to be activated
	 */
	function execute(id, args) {
		new HttpJsonApiDomEditor({ 'id': id }).execute(args);
	}

	/**
	 * "HttpJsonApiDomEditor" instances provide easier access to the "direct PAS"
	 * API endpoints.
	 *
	 * @class HttpJsonApiDomEditor
	 *
	 * @param {object} args Arguments to initialize a given HttpJsonApiDomEditor
	 */
	function HttpJsonApiDomEditor(args) {
		if (args === undefined) {
			throw new Error('Missing required argument');
		}

		if (!('_pas_HttpJsonApiDomEditor_execute' in self)) {
			self._pas_HttpJsonApiDomEditor_execute = execute;
		}

		this.$base_node = null;
		this.executing_spinner = null;
		this.id = null;
		this.modal_overlay = null;

		if ('id' in args) {
			this.$base_node = $("#" + args.id);
			this.id = args.id;
		} else if ('jQnode' in args) {
			this.$base_node = args.jQnode;
			this.id = this.$base_node.attr('id');

			if (this.id === undefined) {
				this.id = ("hjapi_dom_editor_id_" + Math.random().toString().replace(/\W/,'_'));
				this.$base_node.attr('id', this.id);
			}
		}

		if (this.$base_node == null) {
			throw new Error('Missing required arguments');
		}

		if ((!('init_executing_spinner' in args)) || args.init_executing_spinner) {
			this.executing_spinner = new ExecutingSpinner({ id: args.id });
		}

		if ('type' in args) {
			var _this = this;

			if ($.inArray(args.type, [ 'interaction_activated', 'link_activated' ]) > -1) {
				this.$base_node.find('a').each(function(index) {
					var $link = $(this);

					var overlay_action = $link.data('pas-dom-editor-overlay-action');
					var query_string = $link.data('pas-dom-editor-query');

					if ((overlay_action !== undefined || query_string !== undefined)
					    && $link.attr('href') !== undefined
					   ) {
						$link.attr('href', 'javascript:');
					}

					if (overlay_action == 'destroy') {
						Hammer(this).on('tap', function(event) {
							_this.destroy();
						});
					}

					if (query_string !== undefined) {
						Hammer(this).on('tap', function(event) {
							_this.execute({ query: query_string });
						});
					}
				});
			}

			if (args.type == 'interaction_activated') {
				this.$base_node.find('form').each(function(index) {
					var $form = $(this);

					var overlay_action = $form.data('pas-dom-editor-overlay-action');
					var query_string = $form.data('pas-dom-editor-query');

					if ((overlay_action !== undefined || query_string !== undefined)
					    && $form.attr('action') !== undefined
					   ) {
						$form.attr('action', 'javascript:');
					}

					if (overlay_action == 'destroy') {
						$form.on('submit', function(event) {
							_this.destroy();
						});
					}

					if (query_string !== undefined) {
						$form.on('submit', function(event) {
							_this.execute_form_submit({ jQform: $form, query: query_string });
						});
					}
				});
			}
		}
	}

	/**
	 * Destroys the initialized modal overlay node.
	 *
	 * @method
	 */
	HttpJsonApiDomEditor.prototype.destroy = function() {
		if (this.executing_spinner != null) {
			this.executing_spinner.destroy();
			this.executing_spinner = null;
		}

		if (this.modal_overlay != null) {
			this.modal_overlay.destroy();
			this.modal_overlay = null;
		}

		this.$base_node.remove();
		this.$base_node = null;
	}

	/**
	 * Handles the API call response.
	 *
	 * @method
	 *
	 * @param {object} response API call response
	 */
	HttpJsonApiDomEditor.prototype._handle = function(response, response_promise) {
		if ((response.api_call == 'append_overlay_dom'
		     || (response.api_call == 'append_overlay_dom_id' && 'dom_id' in response)
		    )
		    && 'dom_value' in response
		   ) {
			var is_base_node_target = (response.api_call == 'append_overlay_dom');

			var $base_node = $(is_base_node_target ? this.$base_node : "#" + response.dom_id);
			var $overlay_node = $(response.dom_value);
			var $parent_node = $base_node.parent();

			var overlay_node_id = $overlay_node.attr('id');

			if (overlay_node_id === undefined) {
				overlay_node_id = ("hjapi_dom_editor_id_" + Math.random().toString().replace(/\W/,'_'));
				$overlay_node.attr('id', overlay_node_id);
			}

			$parent_node.append($overlay_node);

			var modal_overlay = new ModalOverlay({ jQmodal: $overlay_node, jQoverlayed: $base_node });
			var on_closed_query = $overlay_node.data('pas-dom-editor-overlay-on-closed-query');

			if (on_closed_query !== undefined) {
				var _this = this;

				$overlay_node.one('xdomremove', function(event) {
					_this.execute({ query: on_closed_query });
				});
			}

			var hjapi_dom_editor = new HttpJsonApiDomEditor({ jQnode: $overlay_node, type: 'interaction_activated' });
			hjapi_dom_editor.set_modal_overlay(modal_overlay);

			this._handle_response_api_call('on_appended', response);
		} else if (response.api_call == 'destroy_dom') {
			this.destroy();
			this._handle_response_api_call('on_destroyed', response);
		} else if (response.api_call == 'replace_dom' && 'dom_value' in response) {
			var $new_node = $(response.dom_value);

			if ($new_node.attr('id') === undefined) {
				$new_node.attr('id', this.id);
			}

			if (this.modal_overlay == null) {
				if (this.executing_spinner != null) {
					// Destroy event listeners before replacing the referenced node
					this.executing_spinner.destroy_listeners();
				}

				this.$base_node.replaceWith($new_node);
				this.$base_node = $new_node;
			} else {
				this.$base_node.children().remove();
				this.$base_node.append($new_node.children());

				var hjapi_dom_editor = new HttpJsonApiDomEditor({ jQnode: this.$base_node, type: 'interaction_activated' });
				hjapi_dom_editor.set_modal_overlay(this.modal_overlay);
			}

			this.$base_node.trigger('xdomchanged');

			this._handle_response_api_call('on_replaced', response);
		} else if (response.api_call == 'replace_dom_id'
		           && 'dom_id' in response
		           && 'dom_value' in response
		          ) {
			var $current_node = $("#" + response.dom_id);
			var $new_node = $(response.dom_value);

			if ($new_node.attr('id') === undefined) {
				$new_node.attr('id', response.dom_id);
			}

			$current_node.replaceWith($new_node);
			$current_node.trigger('xdomchanged');

			this._handle_response_api_call('on_replaced', response);
		}

		if (this.executing_spinner != null) {
			this.executing_spinner.destroy();
		}

		response_promise.resolve({ response: response });
	}

	/**
	 * Handles an API call error state.
	 *
	 * @method
	 *
	 * @param {string} error_message Error message returned or to be shown.
	 */
	HttpJsonApiDomEditor.prototype._handle_error = function(error_message, response_promise) {
		if (this.executing_spinner != null) {
			this.executing_spinner.destroy();
		}

		alert(error_message);
		// @TODO: NotificationBox.add_error(error_message);

		response_promise.fail({ error_message: error_message });
	}

	/**
	 * Handles the response API callback.
	 *
	 * @method
	 *
	 * @param {string} api_call API callback definition
	 * @param {object} args Additional API callback arguments
	 */
	HttpJsonApiDomEditor.prototype._handle_response_api_call = function(api_call, args) {
		if (api_call in args) {
			api_call_data = this._parse_response_api_call(args[api_call]);

			var api_call_args = $.extend({ }, args);
			api_call_args['caller_instance'] = this;

			if (!('id' in api_call_args)) {
				api_call_args['id'] = this.id;
			}

			require([ api_call_data.module ], function(js_class) {
				if ('method' in api_call_data) {
					var js_instance = new js_class(api_call_args);
					js_instance[api_call_data.method]();
				} else {
					new js_class(api_call_args);
				}
			});
		}
	}

	/**
	 * Executes an API call.
	 *
	 * @method
	 *
	 * @param {object} args API call arguments
	 */
	HttpJsonApiDomEditor.prototype.execute = function(args) {
		if (args === undefined || (!('query' in args))) {
			throw new Error('Missing required argument');
		}

		var _return = null;

		var cache_data = null;
		var client_storage = null;

		if ('cache_id' in args && 'cache_value' in args) {
			client_storage = new ClientStorage();

			cache_data = (client_storage.is_ready() ? client_storage.get_data(args.cache_id) : null);

			if (cache_data != null
			    && (cache_data._cache_value != args.cache_value || cache_data._proto != '1')
			   ) {
				cache_data = null;
			}
		}

		if (cache_data == null) {
			_return = this._execute(args);

			if (client_storage != null) {
				_return.done(function(data) {
					var cache_supported = ('response' in data
					                       && 'api_call' in data.response
					                       && $.inArray(data.response.api_call, SUPPORTED_CACHE_OPERATIONS) > -1
					                      );

					if (cache_supported) {
						cache_data = data.response;
						cache_data._cache_value = args.cache_value;
						cache_data._proto = '1';

						client_storage.set_data(args.cache_id, cache_data);
					}
				});
			}
		} else {
			if (this.executing_spinner != null) {
				this.executing_spinner.show();
			}

			var $deferred = $.Deferred();
			this._handle(cache_data, $deferred);
		}

		return _return;
	}

	/**
	 * Executes an form submission API call.
	 *
	 * @method
	 *
	 * @param {object} args API call arguments
	 */
	HttpJsonApiDomEditor.prototype.execute_form_submit = function(args) {
		if (args === undefined || (!('query' in args))) {
			throw new Error('Missing required arguments');
		}

		var $form = null;

		if ('id' in args) {
			$form = $("#" + args.id);
		} else if ('jQform' in args) {
			$form = args.jQform;
		}

		if ($form == null) {
			throw new Error('Missing required arguments');
		}

		args['data'] = { };

		$.each($form.serializeArray(), function(i, field_data) {
			args.data[field_data['name']] = field_data['value'];
		});

		args['method'] = 'POST';

		return this._execute(args);
	}

	/**
	 * Executes a non-cached API call.
	 *
	 * @method
	 *
	 * @param {object} args API call arguments
	 *
	 * @return {object} jQuery AJAX promise
	 */
	HttpJsonApiDomEditor.prototype._execute = function(args) {
		var hjapi_request = new HttpJsonApiRequest({ endpoint: 'pas/dynamic/' });

		if (this.executing_spinner != null) {
			this.executing_spinner.show();
		}

		if ('data' in args) {
			data = args.data;
			query_data = hjapi_request.parse_query_string(args.query);
			$.extend(data, query_data);

			args.data = data;
		} else {
			args['data'] = args.query;
		}

		var hjapi_promise = hjapi_request.call(args);
		var _return = $.Deferred();

		var _this = this;

		hjapi_promise.done(function(data, status, jQxhr) {
			if ('api_call' in data) {
				_this._handle(data, _return);
			} else {
				_this._handle_error(status, _return);
			}
		});

		hjapi_promise.fail(function(jQxhr, status, error) {
			if ('responseJSON' in jQxhr
			    && jQxhr.responseJSON !== undefined
			    && 'error' in jQxhr.responseJSON
			    && 'message' in jQxhr.responseJSON.error
			   ) {
				_this._handle_error(jQxhr.responseJSON.error.message, _return);
			} else {
				_this._handle_error(error, _return);
			}
		});

		return _return;
	}

	/**
	 * Parses the response API callback definition.
	 *
	 * @method
	 *
	 * @param {string} api_call API callback definition
	 *
	 * @return {object} Module to initialize and method (if defined) to call
	 */
	HttpJsonApiDomEditor.prototype._parse_response_api_call = function(api_call) {
		var _return = { };
		var api_call_data = api_call.split(':');

		if (api_call_data.length == 2) {
			_return['module'] = api_call_data[0];
			_return['method'] = api_call_data[1];
		} else {
			_return['module'] = api_call_data[0];
		}

		return _return;
	}

	/**
	 * Sets the modal overlay instance for this DOM editor.
	 *
	 * @method
	 *
	 * @param {object} modal_overlay Modal overlay instance
	 */
	HttpJsonApiDomEditor.prototype.set_modal_overlay = function(modal_overlay) {
		this.modal_overlay = modal_overlay;
	}

	return HttpJsonApiDomEditor;
});

//j// EOF