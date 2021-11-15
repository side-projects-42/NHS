/*
 * Licensed to ElasticSearch and Shay Banon under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. ElasticSearch licenses this
 * file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.elasticsearch.test.unit.transport.netty;

import org.elasticsearch.cluster.node.DiscoveryNode;
import org.elasticsearch.common.transport.InetSocketTransportAddress;
import org.elasticsearch.test.unit.transport.AbstractSimpleTransportTests;
import org.elasticsearch.transport.ConnectTransportException;
import org.elasticsearch.transport.TransportService;
import org.elasticsearch.transport.netty.NettyTransport;
import org.testng.annotations.Test;

import static org.elasticsearch.common.settings.ImmutableSettings.settingsBuilder;

@Test
public class SimpleNettyTransportTests extends AbstractSimpleTransportTests {

    @Override
    protected void build() {
        serviceA = new TransportService(settingsBuilder().put("name", "A").build(), new NettyTransport(settingsBuilder().put("name", "A").build(), threadPool), threadPool).start();
        serviceANode = new DiscoveryNode("A", serviceA.boundAddress().publishAddress());

        serviceB = new TransportService(settingsBuilder().put("name", "B").build(), new NettyTransport(settingsBuilder().put("name", "B").build(), threadPool), threadPool).start();
        serviceBNode = new DiscoveryNode("B", serviceB.boundAddress().publishAddress());
    }

    @Override
    public void testHelloWorld() {
        super.testHelloWorld();    //To change body of overridden methods use File | Settings | File Templates.
    }

    @Override
    public void testVoidMessageCompressed() {
        super.testVoidMessageCompressed();    //To change body of overridden methods use File | Settings | File Templates.
    }

    @Test
    public void testConnectException() {
        try {
            serviceA.connectToNode(new DiscoveryNode("C", new InetSocketTransportAddress("localhost", 9876)));
            assert false;
        } catch (ConnectTransportException e) {
//            e.printStackTrace();
            // all is well
        }
    }
}