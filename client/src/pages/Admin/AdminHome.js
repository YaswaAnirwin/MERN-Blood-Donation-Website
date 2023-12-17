import React from "react";
import Layout from "../../components/shared/Layout/Layout";
import { useSelector } from "react-redux";

const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <Layout>
      <div className="container">
        <div className="d-felx flex-column mt-4">
          <h1>
            Welcome Admin <i className="text-success">{user?.name}</i>
          </h1>
          <h3>Manage Blood Bank App </h3>
          <hr />
          <p>Blood donation is a selfless act that involves voluntarily giving blood, a life-saving resource, to those in need. 
            Donated blood is crucial for various medical treatments, surgeries, and emergency situations. 
            The process typically involves a trained healthcare professional drawing a specific amount of blood from a donor, which is then carefully screened for infectious diseases before being stored or transfused.One of the primary reasons for blood donation is to provide a safe and stable blood supply for patients facing medical challenges such as surgeries, trauma, cancer treatments, and chronic illnesses. 
            Blood donation plays a pivotal role in supporting healthcare systems globally, contributing to public health and community well-being.
            Donors often find fulfillment in knowing that their contribution can make a significant impact on someone's life. 
            Regular blood donation drives and campaigns are conducted worldwide to encourage individuals to participate and become donors. 
            This noble act fosters a sense of community and solidarity, emphasizing the importance of collective efforts in maintaining a robust and accessible blood supply for all. 
            Ultimately, blood donation serves as a testament to human compassion, unity, and the commitment to saving lives.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHome;
