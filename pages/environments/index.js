import React, { PropTypes } from 'react';
import PfAlert from 'patternfly-webcomponents/dist/es2015/pf-alert/index.js'
// import { PfAlert } from 'patternfly-webcomponents';

class EnvironmentsPage extends React.Component {

  state = { wizardView: false };

  componentDidMount() {
    document.title = 'Patternfly React Boiler | Environments';
  }

  render() {
    return (
    <pf-alert type="danger">
      <strong>Hey there is a problem!</strong> Yeah this is really messed up and you should <a href="#" class="alert-link">know about it</a>.
    </pf-alert>
    )
  }

}

export default EnvironmentsPage;
