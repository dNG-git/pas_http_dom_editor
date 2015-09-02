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

from dNG.pas.controller.abstract_response import AbstractResponse
from dNG.pas.data.text.input_filter import InputFilter
from dNG.pas.data.xhtml.oset.file_parser import FileParser
from .module import Module

class AbstractDomEditor(Module):
#
	"""
"DomEditor" is used to handle API calls that might change the client DOM
tree.

:author:     direct Netware Group
:copyright:  (C) direct Netware Group - All rights reserved
:package:    pas.http
:subpackage: dom_editor
:since:      v0.1.00
:license:    https://www.direct-netware.de/redirect?licenses;mpl2
             Mozilla Public License, v. 2.0
	"""

	def __init__(self):
	#
		"""
Constructor __init__(AbstractDomEditor)

:since: v0.1.00
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
:since:  v0.1.00
		"""

		return (False
		        if (not isinstance(self.response, AbstractResponse)) else
		        self.response.is_supported("dict_result_renderer")
		       )
	#

	def _set_dom_id(self, dom_id):
	#
		"""
Sets the ID of the client DOM tree to manipulate.

:param dom_id: ID of the client DOM tree

:since: v0.1.00
		"""

		self.dom_id = dom_id
	#

	def _set_dom_replace_oset_result(self, template_name, content):
	#
		"""
@TODO: Document me
		"""

		parser = FileParser()
		parser.set_oset(self.response.get_oset())
		self._set_dom_replace_result(parser.render(template_name, content))
	#

	def _set_dom_replace_result(self, dom_value):
	#
		"""
@TODO: Document me
		"""

		api_call = "replace_dom"
		dom_id = self.dom_id

		if (dom_id is None): dom_id = InputFilter.filter_file_path(self.request.get_dsd("ddom_id", ""))
		elif (self.request.get_dsd("ddom_id", "") != dom_id): api_call = "replace_dom_id"

		self.response.set_result({ "api_call": api_call,
		                           "dom_id": dom_id,
		                           "dom_value": dom_value
		                         })
	#
#

##j## EOF