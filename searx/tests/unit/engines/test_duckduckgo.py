# -*- coding: utf-8 -*-
from collections import defaultdict
import mock
from searx.engines import duckduckgo
from searx.testing import SearxTestCase


class TestDuckduckgoEngine(SearxTestCase):

    def test_request(self):
        query = 'test_query'
        dicto = defaultdict(dict)
        dicto['pageno'] = 1
        dicto['language'] = 'de_CH'
        dicto['time_range'] = ''
        params = duckduckgo.request(query, dicto)
        self.assertIn('url', params)
        self.assertIn(query, params['url'])
        self.assertIn('duckduckgo.com', params['url'])
        self.assertIn('ch-de', params['url'])

    def test_no_url_in_request_year_time_range(self):
        dicto = defaultdict(dict)
        query = 'test_query'
        dicto['time_range'] = 'year'
        params = duckduckgo.request(query, dicto)
        self.assertEqual({}, params['url'])

    def test_response(self):
        self.assertRaises(AttributeError, duckduckgo.response, None)
        self.assertRaises(AttributeError, duckduckgo.response, [])
        self.assertRaises(AttributeError, duckduckgo.response, '')
        self.assertRaises(AttributeError, duckduckgo.response, '[]')

        response = mock.Mock(text='<html></html>')
        self.assertEqual(duckduckgo.response(response), [])

        html = u"""
        <div class="result results_links results_links_deep web-result result--no-result">
            <div class="links_main links_deep result__body">
                <h2 class="result__title">
                </h2>
                <div class="no-results">No results</div>
                <div class="result__extras">
                </div>
            </div>
        </div>
        """
        response = mock.Mock(text=html)
        results = duckduckgo.response(response)
        self.assertEqual(duckduckgo.response(response), [])

        html = u"""
        <div class="result results_links results_links_deep web-result ">
            <div class="links_main links_deep result__body">
                <h2 class="result__title">
                    <a rel="nofollow" class="result__a" href="http://this.should.be.the.link/??">
                        This <b>is</b> <b>the</b> title
                    </a>
                </h2>
                <a class="result__snippet" href="http://this.should.be.the.link/??">
                    <b>This</b> should be the content.
                </a>
                <div class="result__extras">
                </div>
            </div>
        </div>
        """
        response = mock.Mock(text=html)
        results = duckduckgo.response(response)
        self.assertEqual(type(results), list)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'This is the title')
        self.assertEqual(results[0]['url'], u'http://this.should.be.the.link/??')
        self.assertEqual(results[0]['content'], 'This should be the content.')
