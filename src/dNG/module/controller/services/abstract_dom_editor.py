# -*- coding: utf-8 -*-
##j## BOF

"""
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
"""

from dNG.controller.abstract_response import AbstractResponse
from dNG.data.text.input_filter import InputFilter
from dNG.data.xhtml.oset.file_parser import FileParser

from .module import Module

class AbstractDomEditor(Module):
#
	"""
"DomEditor" implementations are used to handle API calls that might change
the client DOM tree.

:author:     direct Netware Group et al.
:copyright:  (C) direct Netware Group - All rights reserved
:package:    pas.http
:subpackage: dom_editor
:since:      v0.2.00
:license:    https://www.direct-netware.de/redirect?licenses;mpl2
             Mozilla Public License, v. 2.0
	"""

	def __init__(self):
	#
		"""
Constructor __init__(AbstractDomEditor)

:since: v0.2.00
		"""

		Module.__init__(self)

		self.dom_id = None
		"""
ID of the client DOM tree to manipulate.
		"""
	#

	def _check_response_instance_supported(self):
	#
		"""
Checks if the response instance supports returning API result dicts.

:return: (bool) True if supported
:since:  v0.2.00
		"""

		return (False
		        if (not isinstance(self.response, AbstractResponse)) else
		        self.response.is_supported("dict_result_renderer")
		       )
	#

	def _set_append_dom_oset_result(self, template_name, content, **kwargs):
	#
		"""
Returns and activates the client API "append_dom" after rendering the given
content with the OSet template. "append_dom_id" is used in case the client
target DOM ID does not correspond to the one calling the server API.

:param template_name: OSet template name
:param content: Content object

:since: v0.2.00
		"""

		oset = self.request.get_dsd("doset")

		parser = FileParser()
		if (oset is not None): parser.set_oset(oset)
		self._set_append_dom_result(parser.render(template_name, content), **kwargs)
	#

	def _set_append_dom_result(self, dom_value, **kwargs):
	#
		"""
Returns the DOM value given and activates the client API "append_dom".
"append_dom_id" is used in case the client target DOM ID does not correspond
to the one calling the server API.

:param dom_value: DOM value to response

:since: v0.2.00
		"""

		api_call = "append_dom"
		dom_id = self.dom_id

		if (dom_id is None): dom_id = InputFilter.filter_file_path(self.request.get_dsd("ddom_id", ""))
		elif (self.request.get_dsd("ddom_id", "") != dom_id): api_call = "append_dom_id"

		result = kwargs

		result.update({ "api_call": api_call,
		                "dom_id": dom_id,
		                "dom_value": dom_value
		              })

		self.response.set_result(result)
	#

	def _set_destroy_dom_result(self, **kwargs):
	#
		"""
Activates the client API "destroy_dom".

:since: v0.2.00
		"""

		result = kwargs
		result.update({ "api_call": "destroy_dom" })

		self.response.set_result(result)
	#

	def _set_dom_id(self, dom_id):
	#
		"""
Sets the ID of the client DOM tree to manipulate.

:param dom_id: ID of the client DOM tree

:since: v0.2.00
		"""

		self.dom_id = dom_id
	#

	def _set_append_overlay_dom_oset_result(self, template_name, content, **kwargs):
	#
		"""
Returns and activates the client API "append_overlay_dom" after rendering
the given content with the OSet template. "append_overlay_dom_id" is used in
case the client target DOM ID does not correspond to the one calling the
server API.

:param template_name: OSet template name
:param content: Content object

:since: v0.2.00
		"""

		oset = self.request.get_dsd("doset")

		parser = FileParser()
		if (oset is not None): parser.set_oset(oset)
		self._set_append_overlay_dom_result(parser.render(template_name, content), **kwargs)
	#

	def _set_append_overlay_dom_result(self, dom_value, **kwargs):
	#
		"""
Returns the DOM value given and activates the client API
"append_overlay_dom". "append_overlay_dom_id" is used in case the client
target DOM ID does not correspond to the one calling the server API.

:param dom_value: DOM value to response

:since: v0.2.00
		"""

		api_call = "append_overlay_dom"
		dom_id = self.dom_id

		if (dom_id is None): dom_id = InputFilter.filter_file_path(self.request.get_dsd("ddom_id", ""))
		elif (self.request.get_dsd("ddom_id", "") != dom_id): api_call = "append_overlay_dom_id"

		result = kwargs

		result.update({ "api_call": api_call,
		                "dom_id": dom_id,
		                "dom_value": dom_value
		              })

		self.response.set_result(result)
	#

	def _set_replace_dom_oset_result(self, template_name, content, **kwargs):
	#
		"""
Returns and activates the client API "replace_dom" after rendering the given
content with the OSet template. "replace_dom_id" is used in case the client
target DOM ID does not correspond to the one calling the server API.

:param template_name: OSet template name
:param content: Content object

:since: v0.2.00
		"""

		oset = self.request.get_dsd("doset")

		parser = FileParser()
		if (oset is not None): parser.set_oset(oset)
		self._set_replace_dom_result(parser.render(template_name, content), **kwargs)
	#

	def _set_replace_dom_result(self, dom_value, **kwargs):
	#
		"""
Returns the DOM value given and activates the client API "replace_dom".
"replace_dom_id" is used in case the client target DOM ID does not
correspond to the one calling the server API.

:param dom_value: DOM value to response

:since: v0.2.00
		"""

		api_call = "replace_dom"
		dom_id = self.dom_id

		if (dom_id is None): dom_id = InputFilter.filter_file_path(self.request.get_dsd("ddom_id", ""))
		elif (self.request.get_dsd("ddom_id", "") != dom_id): api_call = "replace_dom_id"

		result = kwargs

		result.update({ "api_call": api_call,
		                "dom_id": dom_id,
		                "dom_value": dom_value
		              })

		self.response.set_result(result)
	#
#

##j## EOF