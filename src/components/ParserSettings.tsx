import { useNoYoloParser, USER_SOURCE } from "../hooks/use-no-yolo-parser";
import {
  BuiltInAddressInfoFetcher,
  BuiltInAddressInfoFetchersType,
  GenericAddressListEntry,
  NETWORKS,
  TokenListEntry,
} from "no-yolo-signatures";
import { Collapse, Table, Form, Select, Input, Divider, Button } from "antd";

const genericColumns = [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Description",
    dataIndex: "description",
  },
  {
    title: "Chain ID",
    dataIndex: "chainId",
  },
  {
    title: "Address",
    dataIndex: "address",
    render: (val: string, record: GenericAddressListEntry) => {
      const network = NETWORKS[record.chainId];
      if (!network) {
        return val;
      }
      return <a href={`${network.explorerURL}/address/${val}`}>{val}</a>;
    },
  },
];

function AddressInfoFetcherPanel(
  addressInfoFetcher: BuiltInAddressInfoFetcher
) {
  let title = "";
  let body = null;

  switch (addressInfoFetcher.type) {
    case BuiltInAddressInfoFetchersType.GenericAddressList:
      title = "Generic Address list";
      if (addressInfoFetcher.source !== USER_SOURCE) {
        title += ` (Source: ${addressInfoFetcher.source})`;
      }

      body = (
        <Table
          dataSource={addressInfoFetcher.addressList.addresses}
          columns={genericColumns}
        />
      );
      break;
    case BuiltInAddressInfoFetchersType.TokenList:
      title = "TokenList";
      if (addressInfoFetcher.source !== USER_SOURCE) {
        title += ` (Source: ${addressInfoFetcher.source})`;
      }
      const tokenColumns = [
        {
          title: "Name",
          dataIndex: "name",
        },
        {
          title: "Symbol",
          dataIndex: "symbol",
        },
        {
          title: "Chain ID",
          dataIndex: "chainId",
        },
        {
          title: "Address",
          dataIndex: "address",
          render: (val: string, record: TokenListEntry) => {
            const network = NETWORKS[record.chainId];
            if (!network) {
              return val;
            }
            return <a href={`${network.explorerURL}/address/${val}`}>{val}</a>;
          },
        },
      ];
      body = (
        <Table
          dataSource={addressInfoFetcher.tokenList.tokens}
          columns={tokenColumns}
        />
      );
      break;
    case BuiltInAddressInfoFetchersType.Context:
      title = "Context";
      break;

    default:
      break;
  }

  return { title, body };
}

export default function ParserSettings() {
  const { addressInfoFetchers, customAddresses, addCustomAddress } =
    useNoYoloParser();
  const [form] = Form.useForm();
  const requiredRules = [{ required: true }];
  const onFinish = (values: any) => {
    addCustomAddress(values);
    form.resetFields();
  };
  const onChainChange = (chainId: number) => {
    form.setFieldsValue({ chainId });
  };
  return (
    <div>
      <h2>Parser Settings</h2>
      <h4>Address Info Fetchers</h4>

      <Collapse>
        <Collapse.Panel header="Custom Addresses" key="custom">
          <Table dataSource={customAddresses} columns={genericColumns} />
          <Divider />
          <h3>Add new entry</h3>
          <Form form={form} layout="inline" onFinish={onFinish}>
            <Form.Item label="Name" name="name" rules={requiredRules}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              rules={requiredRules}
            >
              <Input />
            </Form.Item>
            <Form.Item name="chainId" label="Chain" rules={requiredRules}>
              <Select style={{ minWidth: "200px" }} onChange={onChainChange}>
                {Object.values(NETWORKS).map((network) => (
                  <Select.Option value={network.chainId}>
                    {network.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Address" name="address" rules={requiredRules}>
              <Input />
            </Form.Item>
            <Form.Item shouldUpdate>
              {() => (
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !form.isFieldsTouched(true) ||
                    !!form
                      .getFieldsError()
                      .filter(({ errors }) => errors.length).length
                  }
                >
                  Add
                </Button>
              )}
            </Form.Item>
          </Form>
        </Collapse.Panel>
        {addressInfoFetchers.map((fetcher, index) => {
          const { title, body } = AddressInfoFetcherPanel(fetcher);
          return (
            <Collapse.Panel header={title} key={index}>
              {body}
            </Collapse.Panel>
          );
        })}
      </Collapse>
    </div>
  );
}
